function sanitizeEditedValue(rawText)
{
  if (rawText === null || rawText === undefined)
  {
    return '';
  }
  let text = String(rawText).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u200B\uFEFF]/g, '').replace(/\u00A0/g, ' ').trim();
  if (text === '')
  {
    return '';
  }
  const isPercent = /%$/.test(text);
  const numericCandidate = text.replace(/%$/, '').replace(/^[$€£¥₹]\s?/, '').replace(/,/g, '').trim();
  if (numericCandidate !== '' && !isNaN(numericCandidate) && !isNaN(parseFloat(numericCandidate)))
  {
    const num = parseFloat(numericCandidate);
    return isPercent ? num / 100 : num;
  }
  return text;
}
module.exports = { sanitizeEditedValue };