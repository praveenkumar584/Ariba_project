const cds = require('@sap/cds');
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');
const { getDestination } = require('@sap-cloud-sdk/connectivity');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

const { fillHeaderData, fillSupplierData,fillLineItemData } = require('./utils/dataFillingHelper');
const { getAccessToken } = require('./utils/generatorOfToken');
const { sendEnvelope } = require('./utils/sendEnvelope');
const { checkEnvelopeStatus } = require('./utils/checkEnvelopeStatus');
const { rebuildSignedExcel } = require('./utils/rebuildSignedExcel');

module.exports = cds.service.impl(function ()
{
  this.on('getTemplateFile', async (req) => {
    try
    {
      const { eventId } = req.data;

      const dest = await getDestination({ destinationName: 'ARIBA_API_Consumption',forwardAuthToken: true });

      /*
      const docusign_dest = await getDestination({ destinationName: 'DOCUSIGN_API',forwardAuthToken: true });
      console.log("DOCUSIGN DESTINATION:", JSON.stringify(docusign_dest, null, 2));
      const destConfig = docusign_dest?.originalProperties ?? {};
      console.log(destConfig);  
      const bearerToken = await getAccessToken(docusign_dest);
      */


      /*
      if (!dest)
      {
        console.error("Destination NOT loaded");
        req.error(500, "Destination not found");
      }

      console.log("Destination loaded:", dest.name);
      console.log("DESTINATION:", JSON.stringify(dest, null, 2));
      const destConfig = dest?.originalProperties ?? {};
      const apiKey = destConfig.destinationConfiguration['URL.queries.apiKey'];
      const baseURL = destConfig.destinationConfiguration['URL'] || dest?.url;
      const token = dest?.authTokens?.[0]?.value;
      console.log("Base URL:", baseURL);
      console.log("apiKey:", apiKey);
      console.log("token present:", !!token);
      */
      
      //Step 1: Fetch Ariba API endpoints data
      const [
          response,
          response1,
          response2 ] = await Promise.all([
              executeHttpRequest(dest, {
              method: 'GET',
              url: `/events/${eventId}/supplierInvitations`
            }),
            executeHttpRequest(dest, {
            method: 'GET',
            url: `/events/${eventId}`
          }),
            executeHttpRequest(dest, {
            method: 'GET',
            url: `/events/${eventId}/items`
          })
        ]);
 
      const apiData = response.data.payload || [];
      const headerData = response1.data|| [];
      const lineItems =response2?.data?.payload || [];

      console.log(JSON.stringify(lineItems, null, 2));

      // Step 2: Load Excel template
      const workbook = new ExcelJS.Workbook();
      const filePath = path.join(__dirname, 'template','BID_motherson_V1_Original.xlsx');
      if (!fs.existsSync(filePath))
      {
        req.error(404, 'Template not found');
        return;
      }
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.getWorksheet('1. MPBC');
      if (!worksheet)
      {
        throw new Error("Worksheet not found");
      }

      fillHeaderData(workbook,worksheet,headerData);
      fillSupplierData( worksheet, apiData);
      fillLineItemData(worksheet,lineItems,apiData,headerData)

      workbook.calcProperties.fullCalcOnLoad = true;
      workbook.calcProperties.calcMode = 'auto';

      const buffer = await workbook.xlsx.writeBuffer({
          useStyles: true,
          useSharedStrings: true
      });
      const base64String = Buffer.from(buffer).toString('base64');
      this.excelBase64 = base64String;
      return base64String;
    }
    catch (error)
    {
      console.error("Error:", error.message);
      req.error(500, error.message);
    }
  });


  this.on('sendToDocusign',async (req) =>{
    try
    {
      const {signerEmail,signerName } = req.data;
      excelBase64= this.excelBase64;
      const docusign_dest = await getDestination({destinationName:'DOCUSIGN_API',forwardAuthToken:true});
      const accountId=docusign_dest.originalProperties.DOCUSIGN_ACCOUNT_ID
      console.log("DOCUSIGN DESTINATION:", JSON.stringify(docusign_dest, null, 2));
      const destConfig = docusign_dest?.originalProperties ?? {};
      console.log(destConfig); 

      const bearerToken = await getAccessToken(docusign_dest);
      const envelope = await sendEnvelope( bearerToken.accessToken,accountId,excelBase64,signerEmail,signerName);
      return JSON.stringify({envelopeId:envelope.envelopeId,status:"SENT" });
    }
    catch (error)
    {
        console.log(error);
        req.error( 500,error.message);
    }
  });

  
  this.on('downloadSignedExcel',async (req) =>{
    try
    {
      const { envelopeId } = req.data;
      const originalExcelBase64= this.excelBase64;
      const docusign_dest = await getDestination({destinationName:'DOCUSIGN_API',forwardAuthToken:true});
      const bearerToken = await getAccessToken( docusign_dest);
      const envelopeData = await checkEnvelopeStatus( bearerToken.accessToken,docusign_dest.originalProperties.DOCUSIGN_ACCOUNT_ID,envelopeId);
      if(envelopeData.status !=="completed")
      { 
        return JSON.stringify({status:"PENDING_SIGNATURE"});
      }
      const finalExcelBase64 = await rebuildSignedExcel(originalExcelBase64,envelopeData.signer,envelopeId);
      return finalExcelBase64;
    }
    catch (error)
    {
        console.log(error);
        req.error(500,error.message);
    }
  });
});