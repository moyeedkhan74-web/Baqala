async function runGeminiApkAnalysis(appData, apkMetadata) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.warn('[AI_MODERATION] GEMINI_API_KEY not set — skipping AI analysis');
    return {
      riskLevel: 'pending',
      analysisError: 'GEMINI_API_KEY not configured',
      approvalScore: null,
    };
  }

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

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
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
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    console.log(`[AI_MODERATION] ✅ Gemini done — score: ${parsed.approvalScore}, summary length: ${parsed.appSummary?.length || 0}`);
    return parsed;

  } catch (err) {
    console.error('[AI_MODERATION] Gemini failed:', err.message);
    return {
      analysisError: err.message,
      riskLevel: 'error',
      approvalScore: null,
      recommendation: null,
    };
  }
}

module.exports = { runGeminiApkAnalysis };
