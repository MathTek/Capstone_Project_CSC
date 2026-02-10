export function detectPII(text, source) {
  const piiPatterns = [

    { 
      type: "credit_card", 
      pattern: /\b(?:4\d{3}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}|5[1-5]\d{2}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}|3[47]\d{2}[\s-]?\d{6}[\s-]?\d{5}|3[0-9]\d{2}[\s-]?\d{6}[\s-]?\d{4}|6011[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/g
    },
    

    { 
      type: "phone", 
      pattern: /(?:\+\d{1,4}[-.\s/]?)?(?:\(\d{1,4}\)[-.\s/]?)?(?:\d{2,4}[-.\s/]?){2,4}\d{2,4}(?:\s?(?:ext|x|extension|poste)\.?\s?\d{1,6})?/gi
    },
    

    { type: "email", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
    

    { type: "social_security", pattern: /\b[12]\d{2}\s?0[1-9]|1[0-2]\s?\d{2}\s?\d{3}\s?\d{3}\s?\d{2}\b/g },
    

    { type: "id_card", pattern: /\b\d{12}\b/g },
    

    { type: "iban", pattern: /\b[A-Z]{2}\d{2}(?:[\s\-]?[A-Z0-9]{4}){3,6}[\s\-]?[A-Z0-9]{1,4}\b/gi },    

    { type: "ip_address", pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g },
    

    { type: "mac_address", pattern: /\b([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\b/g },
    
    { type: "birth_date", pattern: /\b(?:né(?:e)?\s+le\s+)?(?:0[1-9]|[12][0-9]|3[01])[-\/.](?:0[1-9]|1[0-2])[-\/.](?:19|20)\d{2}\b/gi },
    
    { type: "coordinates", pattern: /\b[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)\b/g },
    

    { 
      type: "sensitive_location", 
      pattern: /\b(?:lycée|maison|collège|école|université|hôpital|clinique|commissariat|prison|caserne|base\s+militaire|ambassade|consulat)\s+[A-Za-zÀ-ÿ\s-]+/gi 
    },
    

    { 
      type: "sensitive_keyword", 
      pattern: /\b(?:maison|lycée|collège|école|travail|boulot|bureau|hôpital|clinique|commissariat|domicile|chez\s+moi|chez\s+nous|famille|parents?|enfants?|fils|fille|mari|femme|époux|épouse|conjoint|copain|copine|petit\s+ami|petite\s+amie)\b/gi 
    },
    

    { 
      type: "address", 
      pattern: /\b\d+[\s,]*(?:rue|avenue|boulevard|place|square|impasse|allée|chemin|route|quai)\s+[A-Za-zÀ-ÿ\s-]+/gi 
    },
    

    { 
      type: "personal_info", 
      pattern: /\b(?:né(?:e)?\s+le|date\s+de\s+naissance|domicilié(?:e)?\s+à|réside\s+au?|habite\s+au?|demeurant\s+au?|profession|métier|salaire|revenus)\s+[A-Za-zÀ-ÿ0-9\s,-]+/gi 
    },

    { type: "passport", pattern: /\b[0-9]{2}[A-Z]{2}[0-9]{5}\b/g },
    

    { type: "driving_license", pattern: /\b[0-9]{2}[A-Z]{2}[0-9]{8}\b/g },
    

    { type: "bank_account", pattern: /\b\d{5}\s\d{5}\s[A-Z0-9]{11}\s\d{2}\b/g },
    

    { 
      type: "medical_info", 
      pattern: /\b(?:maladie|pathologie|traitement|médicament|diagnostic|hospitalisation|intervention|opération|thérapie|antécédents?\s+médicaux?|allergies?)(?:\s*[:]\s*)?[A-Za-zÀ-ÿ\s-]+/gi 
    },
    

    { 
      type: "financial_info", 
      pattern: /\b(?:salaire|revenus?|patrimoine|dette|crédit|emprunt|assurance|contrat)\s+(?:de\s+)?[0-9\s€$]+/gi 
    },
    

    { 
      type: "full_name", 
      pattern: /\b[A-ZÀ-Ÿ][a-zà-ÿ]+\s+[A-ZÀ-Ÿ][A-ZÀ-Ÿa-zà-ÿ]+\b/g 
    }
  ];


  function isValidPhone(phoneStr) {
    const digitsOnly = phoneStr.replace(/[^\d]/g, '');

    return digitsOnly.length >= 6 && digitsOnly.length <= 15 && 

           !/^\d{1,2}[\/.]\d{1,2}[\/.]\d{2,4}$/.test(phoneStr.trim()) &&
           !/^\d{1,3}\.\d+$/.test(phoneStr.trim());
  }

  function isValidCreditCard(cardNumber) {

    const digits = cardNumber.replace(/\s|-/g, '');
    if (!/^\d{13,19}$/.test(digits)) return false;
    
    let sum = 0;
    let isEven = false;
    
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    return sum % 10 === 0;
  }

  function isValidEmail(email) {
 
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  function isValidIBAN(iban) {

    const cleaned = iban.replace(/[\s-]/g, '');
    return cleaned.length >= 15 && cleaned.length <= 34;
  }

  const results = [];
  const detectedValues = new Set();

  for (const { type, pattern } of piiPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const value of matches) {
        const cleanValue = value.trim();
        let isValid = true;


        switch (type) {
          case 'phone':
            isValid = isValidPhone(cleanValue);
            break;
          case 'credit_card':
            isValid = isValidCreditCard(cleanValue);
            break;
          case 'email':
            isValid = isValidEmail(cleanValue);
            break;
          case 'iban':
            isValid = isValidIBAN(cleanValue);
            break;
          case 'full_name':
            isValid = !/\b(?:the|and|for|are|but|not|you|all|can|her|was|one|our|out|day|get|has|him|how|man|new|now|old|see|two|way|who|boy|did|its|let|put|say|she|too|use|le|la|les|de|du|des|un|une|et|ou|dans|sur|pour|par|avec|sans|chez|ce|cet|cette|ses|son|sa|mon|ma|mes|notre|votre|leur|ils|elles|est|sont|qui|que|quoi|où|dont|quand|visa|mastercard)\b/i.test(cleanValue);
            break;
          default:
            isValid = true;
        }

        if (isValid && !detectedValues.has(cleanValue)) {
          results.push({ type, value: cleanValue, source });
          detectedValues.add(cleanValue);
        }
      }
    }
  }

  if (results.length === 0) {
    console.log("No PII detected");
  }

  return results;
}
