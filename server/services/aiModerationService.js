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

  // Mapping variables for the prompt
  const appTitle = appData.title || 'Unknown';
  const appDescription = appData.description || 'No description provided';
  const appCategory = Array.isArray(appData.category) ? appData.category.join(', ') : (appData.category || 'Not specified');
  const packageName = apkMetadata.packageName || 'unknown';
  const permissions = apkMetadata.permissions || [];
  const services = apkMetadata.services || [];
  const urls = apkMetadata.suspiciousUrls || [];
  const suspiciousStrings = apkMetadata.dexStrings || [];

  const prompt = `
You are a senior Android app security auditor. Analyze the following APK data and return ONLY a valid JSON object — no markdown, no explanation, no extra text.

=== APP DATA ===
Title: ${appTitle}
Description: ${appDescription}
Category: ${appCategory}
Package Name: ${packageName}
Version: ${apkMetadata.versionName || 'unknown'}
File Count: ${apkMetadata.fileCount || 0}
Native Libraries: ${apkMetadata.nativeLibCount || 0}
Permissions: ${permissions.length > 0 ? permissions.join(', ') : 'NONE DETECTED'}
Background Services: ${services.length > 0 ? services.join(', ') : 'NONE DETECTED'}
Broadcast Receivers: ${Array.isArray(apkMetadata.receivers) ? apkMetadata.receivers.join(', ') : 'NONE DETECTED'}
Hardcoded URLs: ${urls.length > 0 ? urls.join(', ') : 'NONE DETECTED'}
Suspicious Strings: ${suspiciousStrings.length > 0 ? suspiciousStrings.join(', ') : 'NONE DETECTED'}
Extraction Status: ${apkMetadata.extractionError || 'SUCCESS'}

Return this exact JSON structure:

{
  "appInfo": {
    "title": "",
    "packageName": "",
    "category": "",
    "riskLevel": "LOW | MEDIUM | HIGH | CRITICAL"
  },
  "ratings": {
    "security": 0,
    "privacy": 0,
    "content": 0,
    "quality": 0,
    "overall": 0
  },
  "ratingReasons": {
    "security": "",
    "privacy": "",
    "content": "",
    "quality": ""
  },
  "permissionAudit": [
    {
      "permission": "",
      "risk": "LOW | MEDIUM | HIGH",
      "reason": ""
    }
  ],
  "flags": {
    "emptyApp": false,
    "suspiciousUrls": false,
    "dangerousPermissions": false,
    "hiddenServices": false
  },
  "verdict": "",
  "decision": "APPROVE | REJECT | REVIEW",
  "rejectionReasons": [],
  "approvalConditions": [],
  "summary": ""
}

RULES:
1. All rating values must be integers between 0-100.
2. overall = weighted average of security(30%) + privacy(30%) + content(20%) + quality(20%).
3. If permissions, services, URLs, and strings are ALL empty, set emptyApp: true and quality below 30.
4. permissionAudit must never be an empty array — if no permissions, return one entry with "NONE DETECTED".
5. decision must be exactly: APPROVE, REJECT, or REVIEW.
6. ratingReasons must always have a sentence for all four categories.
7. Return ONLY the JSON. No markdown. No extra text.
`;

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
            maxOutputTokens: 1000,
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      };

      const response = await fetch(endpoint, fetchOptions);

      if (!response.ok) {
        const errBody = await response.text();
        if (response.status === 429 && attempt < MAX_RETRIES) {
          const waitTime = (attempt + 1) * 3000;
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

      // --- COMPATIBILITY SHIM (Optional but recommended for stability) ---
      // This ensures existing UI components and background scan logic don't break immediately
      const flattened = {
        ...parsed,
        approvalScore: parsed.ratings?.overall,
        riskLevel: parsed.appInfo?.riskLevel?.toLowerCase(),
        recommendation: parsed.decision?.toLowerCase(),
        appSummary: parsed.summary,
        // Map permissionAudit back to the format the UI expects for permissionAnalysis if needed
        permissionAnalysis: Array.isArray(parsed.permissionAudit) 
          ? parsed.permissionAudit.map(p => `${p.permission} (${p.risk}): ${p.reason}`).join('\n')
          : ''
      };

      console.log(`[AI_MODERATION] ✅ ${useGroq ? 'Groq' : 'Gemini'} done — score: ${flattened.approvalScore}, decision: ${flattened.decision}`);
      return flattened;

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
