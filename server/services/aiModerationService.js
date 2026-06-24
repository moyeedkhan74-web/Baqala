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

  const prompt = `You are an expert Android app store security reviewer for Baqala App Store. Analyze this submission thoroughly and respond ONLY with valid JSON.

{
  "appSummary": "3-4 detailed sentences about what this app does, its purpose, and quality assessment. Be specific and informative.",
  "shortDescription": "One-line catchy hook (max 80 chars) for store listings",
  "approvalScore": <integer 0-100>,
  "riskLevel": "low" | "medium" | "high" | "critical",
  "verdict": "One powerful sentence: your final recommendation as if briefing a CEO. Example: 'Safe utility app with clean permissions — approve immediately.' or 'Suspicious gambling wrapper disguised as a calculator — reject.'",
  "ratings": {
    "security": <integer 0-100, "How safe is this app from a security standpoint?">,
    "privacy": <integer 0-100, "Does it respect user privacy? Minimal data collection?">,
    "content": <integer 0-100, "Is the content appropriate for all audiences?">,
    "quality": <integer 0-100, "How well-built and professional does the app appear?">
  },
  "targetAudience": "One clear sentence describing who this app is built for",
  "keyFeatures": ["4-6 specific functionalities detected — be detailed, e.g. 'Offline GPS navigation with map caching' not just 'Maps'"],
  "permissionAnalysis": "Detailed paragraph: list each permission, explain why it would be needed, and explicitly flag any that don't match the app's stated purpose. If no permissions, explain what that means.",
  "contentFlags": ["specific policy concerns — empty array [] if none"],
  "suspiciousSignals": ["technical red flags from APK internals — empty array [] if none"],
  "recommendation": "approve" | "review" | "reject",
  "adminNote": "2-3 sentences of direct, actionable advice for the human reviewer. Be specific about what to check."
}

SCORING GUIDE:
- 85-100: Clearly safe, well-built app. Approve confidently.
- 60-84: Probably fine but has minor concerns worth reviewing.
- 40-59: Suspicious elements detected. Needs careful human review.
- 20-39: Strong reject signals. Multiple red flags found.
- 0-19: Malicious or fraudulent. Reject immediately.

IMPORTANT: Even if an app has minimal metadata, still provide thoughtful analysis. Rate quality lower if the submission lacks proper descriptions, icons, or metadata — this itself is a quality concern. Never leave ratings at 0 unless the app is actively malicious.

Flag HIGH or CRITICAL if ANY of these: package name contains bet/casino/slot/adult/xxx/porn/hack/cheat; app requests SMS+CONTACTS+CALL_LOG without a communication purpose; package name impersonates known brands; description contradicts dex code strings (FRAUD — score 0-15); vague description with 5+ dangerous permissions.

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
Suspicious keywords: ${(apkMetadata.dexStrings || []).join(' | ') || 'none found'}
Hardcoded URLs: ${(apkMetadata.suspiciousUrls || []).join(' | ') || 'none found'}
Extraction error: ${apkMetadata.extractionError || 'none'}

CRITICAL: Code contents above are from compiled bytecode — cannot be altered by developer. If description claims one thing but code contains gambling/adult/fraud strings, that is deception — score 0-15 and riskLevel "critical".`;

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
          model: 'llama-3.3-70b-versatile',
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
