
/**
 * GOOGLE SHEET SETUP:
 * Headers in Row 1 (A to K):
 * ID | TicketNumber | Name | ApplicationType | Barangay | VoterType | Status | Remarks | Timestamp | QueueStatus | Counter
 * 
 * Settings Sheet Headers:
 * Key | Value
 */

const SPREADSHEET_ID = '1QRleDnx6TpmaDUGluqqzRofkDthpN1viSDpYEN-iIko';

function doGet(e) {
  if (!e || !e.parameter) {
    return ContentService.createTextOutput("Backend Active. Direct access not supported.")
      .setMimeType(ContentService.MimeType.TEXT);
  }

  const action = e.parameter.action;
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  try {
    if (action === 'getTickets') {
      const data = getData(ss, 'Tickets');
      return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
    }
    if (action === 'getConfig') {
      const config = getConfig(ss);
      return ContentService.createTextOutput(JSON.stringify(config))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({error: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    if (data.action === 'updateTicketStatus') {
      const sheet = ss.getSheetByName('Tickets');
      const { id, status, counter } = data;
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0].toString() === id.toString()) {
          sheet.getRange(i + 1, 10).setValue(status);  // Column J: QueueStatus
          sheet.getRange(i + 1, 11).setValue(counter); // Column K: Counter
          break;
        }
      }
      return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'addTicket') {
      const sheet = ss.getSheetByName('Tickets');
      const t = data.ticket;
      sheet.appendRow([
        t.id, t.ticketNumber, t.name, t.applicationType, t.barangay, t.voterType,
        t.civilStatus, t.remarks, t.timestamp, 'W', 0
      ]);
      return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === 'updateSettings') {
      const sheet = ss.getSheetByName('Settings');
      if (!sheet) return ContentService.createTextOutput(JSON.stringify({success: false, error: "Settings sheet not found"})).setMimeType(ContentService.MimeType.JSON);
      
      const settingsMap = {
        'officeName': data.officeName,
        'videoUrl': data.videoUrl,
        'logo': data.logo
      };
      
      sheet.clear();
      sheet.appendRow(['Key', 'Value']);
      
      for (let key in settingsMap) {
        if (settingsMap[key] !== undefined) {
          sheet.appendRow([key, settingsMap[key]]);
        }
      }
      
      // Persist Bulletins
      if (Array.isArray(data.bulletins)) {
        data.bulletins.forEach(b => {
          if (b.trim() !== "") {
            sheet.appendRow(['bulletin', b]);
          }
        });
      }

      // Persist Carousel Images
      if (Array.isArray(data.carouselImages)) {
        data.carouselImages.forEach(img => {
          if (img.trim() !== "") {
            sheet.appendRow(['carouselImage', img]);
          }
        });
      }
      
      return ContentService.createTextOutput(JSON.stringify({success: true})).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getData(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  
  const headers = rows[0].map(h => h.toString().trim());
  const data = [];
  
  for (let i = 1; i < rows.length; i++) {
    const obj = {};
    headers.forEach((h, j) => {
      obj[h] = rows[i][j];
    });
    data.push(obj);
  }
  return data;
}

function getConfig(ss) {
  const sheet = ss.getSheetByName('Settings');
  const defaultConfig = { 
    officeName: "QUEUING SYSTEM", 
    bulletins: ["Welcome to our office. Please wait for your turn."],
    carouselImages: []
  };
  
  if (!sheet) return defaultConfig;
  
  const data = sheet.getDataRange().getValues();
  const config = { bulletins: [], carouselImages: [], officeName: defaultConfig.officeName, videoUrl: "", logo: "" };
  
  data.forEach(row => { 
    if (row[0] && row[1]) {
      const key = row[0].toString().trim();
      const value = row[1].toString();
      
      if (key.toLowerCase() === 'bulletin') {
        config.bulletins.push(value);
      } else if (key.toLowerCase() === 'carouselimage') {
        config.carouselImages.push(value);
      } else {
        config[key] = value;
      }
    }
  });
  
  if (config.bulletins.length === 0) {
    config.bulletins = defaultConfig.bulletins;
  }
  
  return config;
}
