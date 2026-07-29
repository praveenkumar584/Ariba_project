const cds = require('@sap/cds');
const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');
const { getDestination } = require('@sap-cloud-sdk/connectivity');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

const sessionStore = new Map();

const { fillHeaderData, fillSupplierData, fillLineItemData } = require('./utils/dataFillingHelper');
const { getAccessToken } = require('./utils/generatorOfToken');
const { sendEnvelope } = require('./utils/sendEnvelope');
const { checkEnvelopeStatus } = require('./utils/checkEnvelopeStatus');
const { downloadSignedPdf } = require('./utils/downloadSignedPdf');
const { sanitizeEditedValue } = require('./utils/sanitizeEditedValue');
const { buildDocusignBuffer, targetSheet } = require('./utils/buildDocusignBuffer');

module.exports = cds.service.impl(function ()
{
  this.on('getTemplateFile', async (req) => {
    try
    {
      const { eventId } = req.data;
      const dest = await getDestination({ destinationName: 'ARIBA_API_Consumption', forwardAuthToken: true });
      const [response,response1,response2,response3] = await Promise.all([
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
        }),
        executeHttpRequest(dest, {
          method: 'GET',
          url: `/events/${eventId}/bidSummary`
        })
      ]);
      const apiData = response.data.payload || [];
      const headerData = response1.data || [];
      const lineItems = response2?.data?.payload || [];
      const bidSummary = response3?.data || [];
      const NoOfSupplierInvitation = apiData?.length || 0;
      const NoOfSuppliers = bidSummary?.participatedCount || 0;
      const workbook = new ExcelJS.Workbook();
      const filePath = path.join(__dirname, 'template', 'BID_motherson_V1_Original.xlsx');
      if (!fs.existsSync(filePath))
      {
        req.error(404, 'Template not found');
        return;
      }
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.getWorksheet(targetSheet);
      if (!worksheet)
      {
        throw new Error('Worksheet not found');
      }
      fillHeaderData(workbook, worksheet, headerData);
      fillSupplierData(worksheet, apiData);
      fillLineItemData(worksheet, lineItems, apiData, headerData);
      workbook.calcProperties.fullCalcOnLoad = true;
      workbook.calcProperties.calcMode = 'auto';
      const rawBuffer = await workbook.xlsx.writeBuffer({
        useStyles: true,
        useSharedStrings: false
      });
      const downloadId = cds.utils.uuid();
      sessionStore.set(downloadId, { rawBuffer });
      base64String = Buffer.from(rawBuffer).toString('base64');
      //const docusignBuffer = await buildDocusignBuffer(rawBuffer);
      //const base64String = Buffer.from(docusignBuffer).toString('base64');
      return { base64:base64String,downloadId: downloadId,NoOfSuppliers: NoOfSuppliers};
    }
    catch (error)
    {
      console.error('Error:', error.message);
      req.error(500, error.message);
    }
  });

  this.on('downloadTemplateFile', async (req) => {
    try
    {
      const { downloadId } = req.data;
      const session = sessionStore.get(downloadId);
      if (!session)
      {
        req.error(404, 'Workbook not found');
        return;
      }
      req._.res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      req._.res.setHeader('Content-Disposition', 'attachment; filename=Bid_Template_filled.xlsx');
      req._.res.end(session.rawBuffer);
    }
    catch (error)
    {
      console.error(error);
      req.error(500, error.message);
    }
  });

  this.on('updateWorkbook', async (req) => {
    try
    {
      const { downloadId, changes } = req.data;
      const session = sessionStore.get(downloadId);
      if (!session)
      {
        req.error(404, 'Workbook not found');
        return;
      }
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(session.rawBuffer);
      const worksheet = workbook.getWorksheet(targetSheet);
      if (!worksheet)
      {
        req.error(404, 'Worksheet not found');
        return;
      }
      const editedCells = JSON.parse(changes);
      editedCells.forEach((change) => {
        const cell = worksheet.getCell(change.cell);
        cell.value = sanitizeEditedValue(change.value);
      });
      workbook.calcProperties.fullCalcOnLoad = true;
      workbook.calcProperties.calcMode = 'auto';
      const updatedRawBuffer = await workbook.xlsx.writeBuffer({
        useStyles: true,
        useSharedStrings: false
      });
      sessionStore.set(downloadId, { rawBuffer: updatedRawBuffer });
      const docusignBuffer = await buildDocusignBuffer(updatedRawBuffer);
      const base64String = Buffer.from(docusignBuffer).toString('base64');
      return { base64: base64String };
    }
    catch (error)
    {
      console.error(error);
      req.error(500, error.message);
    }
  });

  this.on('sendToDocusign', async (req) => {
    try
    {
      const { downloadId, signerEmail, signerName } = req.data;
      const session = sessionStore.get(downloadId);
      if (!session)
      {
        req.error(404, 'Workbook not found. Please reload the template.');
        return;
      }
      const docusignBuffer = await buildDocusignBuffer(session.rawBuffer);
      const excelBase64 = Buffer.from(docusignBuffer).toString('base64');
      const docusign_dest = await getDestination({ destinationName: 'DOCUSIGN_API', forwardAuthToken: true });
      const accountId = docusign_dest.originalProperties.DOCUSIGN_ACCOUNT_ID;
      const bearerToken = await getAccessToken(docusign_dest);
      const envelope = await sendEnvelope(bearerToken.accessToken, accountId, excelBase64, signerEmail, signerName);
      return envelope;
    }
    catch (error)
    {
      console.log(error);
      req.error(500, error.message);
    }
  });

  this.on('downloadSignedPdf', async (req) => {
    try
    {
      const { envelopeId } = req.data;
      const docusign_dest = await getDestination({ destinationName: 'DOCUSIGN_API', forwardAuthToken: true });
      const bearerToken = await getAccessToken(docusign_dest);
      const envelopeData = await checkEnvelopeStatus(bearerToken.accessToken, docusign_dest.originalProperties.DOCUSIGN_ACCOUNT_ID, envelopeId);
      if (envelopeData.status !== 'completed')
      {
        return JSON.stringify({ status: 'PENDING_SIGNATURE' });
      }
      const signedPdfBuffer = await downloadSignedPdf(bearerToken.accessToken, docusign_dest.originalProperties.DOCUSIGN_ACCOUNT_ID, envelopeId);
      req._.res.setHeader('Content-Type', 'application/pdf');
      req._.res.setHeader('Content-Disposition', `attachment; filename=SIGNED_${envelopeId}.pdf`);
      req._.res.send(signedPdfBuffer);
      return JSON.stringify({ status: 'COMPLETED', message: 'Signed PDF downloaded successfully' });
    }
    catch (error)
    {
      console.error(error);
      req.error(500, error.message);
    }
  });
});