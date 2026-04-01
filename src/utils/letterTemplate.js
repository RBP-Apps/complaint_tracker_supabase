
export const generateLetterHTML = (taskData, headerInfo, letterInfo) => {
  return `
    <html>
      <head>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid black; padding-bottom: 10px; }
          .company-name { font-size: 24px; font-weight: bold; }
          .company-details { font-size: 12px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .label { font-weight: bold; }
          .content { margin-top: 20px; text-align: justify; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; }
          th, td { border: 1px solid black; padding: 8px; text-align: center; font-size: 12px; }
          .footer { margin-top: 40px; margin-left: 20px; }
          .signature { margin-top: 50px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${headerInfo.companyName}</div>
          <div class="company-details">${headerInfo.address}</div>
          <div class="company-details">${headerInfo.location || ''}</div>
          <div class="company-details">${headerInfo.contact}</div>
        </div>

        <div class="row">
          <div><span class="label">पत्र क्र.:</span> ${letterInfo.letterNo}</div>
          <div><span class="label">दिनांक:</span> ${letterInfo.date}</div>
        </div>

        <div class="content">
          <p class="label">प्रति,</p>
          <div style="padding-left: 40px;">
            ${letterInfo.officerName}<br>
            ${letterInfo.department}<br>
            ${letterInfo.districtOffice}
          </div>
        </div>

        <div class="content">
          <p><span class="label">विषय:-</span> ${letterInfo.subject}</p>
        </div>

        <div class="content">
          <p><span class="label">संदर्भ:-</span></p>
          <ol>
            ${letterInfo.reference.map(ref => `<li>${ref}</li>`).join('')}
          </ol>
        </div>

        <div class="content">
          <p>${letterInfo.salutation}</p>
          <p>${letterInfo.introParagraph}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>क्र.</th>
              <th>सौर समाधान क्र.</th>
              <th>आई. डी. नं.</th>
              <th>हितग्राही का नाम</th>
              <th>ग्राम/ विकासखण्ड़</th>
              <th>दिनांक</th>
              <th>रिमार्क</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>01.</td>
              <td>${taskData.complaintId || '-'}</td>
              <td>${taskData.idNumber || '-'}</td>
              <td>${taskData.beneficiaryName || '-'}</td>
              <td>${taskData.village || ''}/ ${taskData.block || ''}</td>
              <td>${taskData.actualDate || '-'}</td>
              <td>संयंत्र कार्य शील हैं।</td>
            </tr>
          </tbody>
        </table>

        <div class="content">
          <p>${letterInfo.closingParagraph}</p>
          <p style="text-align: center; font-weight: bold;">${letterInfo.thankYou}</p>
        </div>

        <div class="footer">
          <div class="signature">${letterInfo.regards}</div>
          <br><br>
          <div class="signature">${letterInfo.forCompany}</div>
          <div class="signature">${letterInfo.designation}</div>
        </div>

        <div class="content" style="margin-top: 40px; font-style: italic; font-size: 12px;">
          <p class="label">प्रतिलिपि:—</p>
          <ol>
            ${letterInfo.copiesTo.map(copy => `<li>${copy}</li>`).join('')}
          </ol>
        </div>
      </body>
    </html>
  `;
};
