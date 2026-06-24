async function runGeminiApkAnalysis(appData, apkMetadata, tier = 'low') {
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

  const tierInstructions = {
    low: "Leniency: HIGH. This is a leisure/hobbyist tier. Focus primarily on blatant malware and absolute privacy violations. Minor resource usage or unoptimized code is acceptable.",
    mid: "Leniency: MEDIUM. Balanced audit. Verify that the app's functionality (permissions/services) generally aligns with its description. Standard security checks apply.",
    high: "Leniency: LOW. Professional tier. Heavy scrutiny on privacy. Any permission that isn't clearly explained in the description should be flagged as a risk.",
    advance: "Leniency: ZERO. Enterprise/Experimental tier. Maximum scrutiny. Cross-reference every internal Dex string and hardcoded URL against the description. Flag any 'Hidden Features' or undocumented behaviors."
  };

  const prompt = `
You are a senior Android app security auditor. Analyze the following APK data and return ONLY a valid JSON object — no markdown, no explanation, no extra text.

=== AUDIT TIER: ${tier.toUpperCase()} ===
INSTRUCTIONS: ${tierInstructions[tier]}

=== MOTIVE VS REALITY CHECK ===
A human developer has provided a description of what this app does. Your primary mission is to compare their "Motive" (Description) against the "Reality" (Technical Artifacts). 
1. Check if the app requests sensitive permissions (GPS, SMS, CAMERA) that aren't mentioned or justified by the description.
2. Check if internal code strings suggest features (e.g., ad-tracking, data scraping) that are hidden from the user description.
3. Be especially vigilant about privacy details.

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
    "legal": 0,
    "performance": 0,
    "transparency": 0,
    "dataHandling": 0,
    "overall": 0
  },

  "ratingReasons": {
    "security": "explain score based on permissions and suspicious strings",
    "privacy": "explain score based on data access and background services",
    "content": "explain score based on app description vs actual functionality",
    "legal": "explain score based on compliance, policy violations, or red flags",
    "performance": "explain score based on background services and resource usage",
    "transparency": "explain score based on how honest the app metadata is",
    "dataHandling": "explain score based on how user data may be collected or shared"
  },

  "permissionAudit": [
    {
      "permission": "",
      "risk": "LOW | MEDIUM | HIGH | CRITICAL",
      "reason": ""
    }
  ],

  "networkAudit": [
    {
      "url": "",
      "risk": "LOW | MEDIUM | HIGH | CRITICAL",
      "reason": ""
    }
  ],

  "stringAudit": [
    {
      "string": "",
      "risk": "LOW | MEDIUM | HIGH | CRITICAL",
      "reason": ""
    }
  ],

  "serviceAudit": [
    {
      "service": "",
      "risk": "LOW | MEDIUM | HIGH | CRITICAL",
      "reason": ""
    }
  ],

  "flags": {
    "emptyApp": false,
    "suspiciousUrls": false,
    "dangerousPermissions": false,
    "hiddenServices": false,
    "legalViolation": false,
    "privacyRisk": false,
    "dataExfiltration": false,
    "malwareIndicators": false
  },

  "legalAnalysis": {
    "gdprCompliant": true,
    "coppaCompliant": true,
    "playPolicyViolations": [],
    "concerns": []
  },

  "verdict": "",
  "decision": "APPROVE | REJECT | REVIEW",

  "rejectionReasons": [],
  "approvalConditions": [],

  "summary": ""
}

RULES:
1. All rating values must be integers between 0-100.
2. overall = weighted average: security(25%) + privacy(20%) + content(15%) + legal(15%) + performance(10%) + transparency(10%) + dataHandling(5%).
3. Performance Scoring: If an app has 0 background services, set performance to 100 (efficient). Penalty only if heavy/suspicious services are detected.
4. If permissions, services, URLs, and strings are ALL empty — set emptyApp: true, quality below 30, decision as REJECT.
5. All 7 ratingCategories (security, privacy, content, legal, performance, transparency, dataHandling) MUST be provided.
6. permissionAudit, networkAudit, stringAudit, and serviceAudit must never be empty arrays.
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
            maxOutputTokens: 1500,
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

      // --- COMPATIBILITY SHIM ---
      const flattened = {
        ...parsed,
        approvalScore: parsed.ratings?.overall,
        riskLevel: parsed.appInfo?.riskLevel?.toLowerCase(),
        recommendation: parsed.decision?.toLowerCase(),
        appSummary: parsed.summary
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
