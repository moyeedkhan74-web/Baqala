async function runGeminiApkAnalysis(appData, apkMetadata) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[AI_MODERATION] GEMINI_API_KEY not set — skipping AI analysis');
    return { analysisError: 'GEMINI_API_KEY not configured', riskLevel: 'pending' };
  }

  const prompt = `You are a senior Android app security and content reviewer for Baqala App Store. Analyze this app submission and respond ONLY with valid JSON — no markdown, no explanation outside the JSON.

{
  "appSummary": "2-3 sentences: what this app actually appears to do based on ALL evidence",
  "approvalScore": <integer 0-100>,
  "riskLevel": "low" | "medium" | "high" | "critical",
  "permissionAnalysis": "one paragraph assessing whether permissions match the claimed purpose",
  "contentFlags": ["specific policy concerns — empty array if none"],
  "suspiciousSignals": ["technical red flags from APK internals — empty array if none"],
  "recommendation": "approve" | "review" | "reject",
  "adminNote": "1-2 sentences of direct actionable advice for the human reviewer"
}

approvalScore guide: 85-100 clearly safe; 60-84 probably fine but review; 40-59 suspicious; 0-39 strong reject signals.

Flag HIGH/CRITICAL if: package name contains bet/casino/slot/adult/xxx/porn; app requests SMS+CONTACTS+CALL_LOG with no communication purpose stated; package impersonates known brands (com.google.*, com.whatsapp.*, com.facebook.*); vague description with many dangerous permissions; background services suggesting data exfiltration.

DEVELOPER SUBMISSION:
Title: ${appData.title}
Category: ${appData.category}
Description: ${appData.description}
Tags: ${(appData.tags || []).join(', ')}

APK INTERNALS:
Package: ${apkMetadata.packageName}
Version: ${apkMetadata.versionName}
Permissions (${apkMetadata.permissions.length}): ${apkMetadata.permissions.join(', ')}
Services: ${apkMetadata.services.join(', ') || 'none'}
Receivers: ${apkMetadata.receivers.join(', ') || 'none'}
Native libs: ${apkMetadata.nativeLibCount}
Total files: ${apkMetadata.fileCount}
Extraction error: ${apkMetadata.extractionError || 'none'}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 800, temperature: 0.1 }
        })
      }
    );
    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    console.log(`[AI_MODERATION] Gemini analysis complete — risk: ${parsed.riskLevel}, score: ${parsed.approvalScore}`);
    return parsed;
  } catch (err) {
    console.error('[AI_MODERATION] Gemini analysis failed:', err.message);
    return { analysisError: err.message, riskLevel: 'error', approvalScore: null };
  }
}

module.exports = { runGeminiApkAnalysis };
