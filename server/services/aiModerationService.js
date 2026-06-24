async function runGeminiApkAnalysis(appData, apkMetadata) {
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const groqKey = process.env.GROQ_API_KEY?.trim();
  
  if (!geminiKey && !groqKey) {
    console.warn('[AI_MODERATION] No AI API Key (Gemini/Groq) set — skipping AI analysis');
    return {
      riskLevel: 'pending',
      analysisError: 'AI integration not configured',
      approvalScore: null,
    };
  }

  // Prioritize Groq if key exists, otherwise fallback to Gemini
  const useGroq = !!groqKey;
  const apiKey = useGroq ? groqKey : geminiKey;
  const endpoint = useGroq 
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const prompt = `You are a strict Android app store security reviewer for Baqala App Store. Analyze this app submission and respond ONLY with valid JSON — no markdown, no backticks, no explanation outside the JSON object.

{
  "appSummary": "2-3 sentences: what this app actually appears to do based on ALL evidence — developer claims AND APK code combined",
  "shortDescription": "One-line catchy hook (max 80 chars) for store listings",
  "approvalScore": <integer 0-100>,
  "riskLevel": "low" | "medium" | "high" | "critical",
  "targetAudience": "one sentence describing the likely intended users",
  "keyFeatures": ["3-5 core functionalities detected from code"],
  "permissionAnalysis": "one paragraph: do the requested permissions match the claimed purpose? Flag mismatches explicitly.",
  "contentFlags": ["specific policy concerns — empty array if none"],
  "suspiciousSignals": ["technical red flags from APK internals — empty array if none"],
  "recommendation": "approve" | "review" | "reject",
  "adminNote": "1-2 sentences of direct, actionable advice for the human reviewer"
}

approvalScore: 85-100 clearly safe approve; 60-84 probably fine but review; 40-59 suspicious careful review; 0-39 strong reject signals.

Flag HIGH or CRITICAL if ANY of these: package name contains bet/casino/slot/adult/xxx/porn/hack/cheat; app requests SMS+CONTACTS+CALL_LOG without a communication purpose in description; package name impersonates known brands (com.google.*, com.whatsapp.*, com.facebook.*, com.instagram.*); description says one thing but dex code strings say another (this is FRAUD — score 0-20); vague description with 5+ dangerous permissions; services/receivers suggesting background data collection without disclosure.

DEVELOPER SUBMISSION:
Title: ${appData.title}
Category: ${Array.isArray(appData.category) ? appData.category.join(', ') : (appData.category || 'Not specified')}
Description: ${appData.description || 'No description provided'}
Tags: ${(appData.tags || []).join(', ') || 'none'}

APK MANIFEST (extracted from AndroidManifest.xml):
Package name: ${apkMetadata.packageName || 'unknown'}
Version: ${apkMetadata.versionName || 'unknown'}
Permissions (${(apkMetadata.permissions || []).length} total): ${(apkMetadata.permissions || []).join(', ') || 'none'}
Background services: ${(apkMetadata.services || []).join(', ') || 'none'}
Broadcast receivers: ${(apkMetadata.receivers || []).join(', ') || 'none'}
Native libraries: ${apkMetadata.nativeLibCount || 0}
Total files in APK: ${apkMetadata.fileCount || 0}

APK CODE CONTENTS (extracted from classes.dex — cannot be faked by developer):
Suspicious keywords found in compiled code: ${(apkMetadata.dexStrings || []).join(' | ') || 'none found'}
Hardcoded URLs and API endpoints in code: ${(apkMetadata.suspiciousUrls || []).join(' | ') || 'none found'}
Extraction error: ${apkMetadata.extractionError || 'none'}

CRITICAL INSTRUCTION: The "APK CODE CONTENTS" section above is extracted from compiled bytecode and cannot be altered by the developer. If the description claims one thing but the code contains gambling/adult/fraud-related strings, that is deliberate deception — assign approvalScore 0-15 and riskLevel "critical".`;

  const MAX_RETRIES = 2;
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    try {
      const fetchOptions = useGroq ? {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        })
      } : {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 800,
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      };

      const response = await fetch(endpoint, fetchOptions);

      if (!response.ok) {
        const errBody = await response.text();
        // If it's a 429 and we have retries left, wait and retry
        if (response.status === 429 && attempt < MAX_RETRIES) {
          const waitTime = (attempt + 1) * 3000; // 3s, 6s
          console.warn(`[AI_MODERATION] ⚠️ Quota hit (429). Retrying in ${waitTime}ms... (Attempt ${attempt + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          attempt++;
          continue;
        }
        throw new Error(`AI API error ${response.status}: ${errBody.slice(0, 200)}`);
      }

      const data = await response.json();
      let rawText = '';
      
      if (useGroq) {
        rawText = data.choices?.[0]?.message?.content || '';
      } else {
        rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }

      const clean = rawText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);

      console.log(`[AI_MODERATION] ✅ ${useGroq ? 'Groq' : 'Gemini'} done — score: ${parsed.approvalScore}, summary length: ${parsed.appSummary?.length || 0}`);
      return parsed;

    } catch (err) {
      if (attempt >= MAX_RETRIES) {
        const timestampedError = `[${new Date().toLocaleTimeString()}] ${err.message}`;
        console.error(`[AI_MODERATION] ${useGroq ? 'Groq' : 'Gemini'} failed after retries:`, timestampedError);
        return {
          analysisError: timestampedError,
          riskLevel: 'error',
          approvalScore: null,
          recommendation: null,
        };
      }
      attempt++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

module.exports = { runGeminiApkAnalysis };
