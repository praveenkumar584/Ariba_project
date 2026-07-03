service apiServiceConsumption
{
  function getTemplateFile(eventId: String) returns LargeString;
  action downloadTemplateFile(downloadId : String);
  //Docusign Part
  action sendToDocusign(downloadId: String, signerEmail: String, signerName: String) returns LargeString;
  action downloadSignedPdf(envelopeId : String) returns String;
  //Update the workbook with the changes made by the user
  action updateWorkbook(downloadId:String, changes:LargeString) returns LargeString;
}