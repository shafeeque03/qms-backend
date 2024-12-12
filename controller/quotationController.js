import User from "../model/userModel.js";
import Client from "../model/clientModel.js";
import Quotation from "../model/quotationModel.js";
import Product from "../model/productModel.js";
import Service from "../model/serviceModel.js";
import Admin from "../model/adminModel.js"
import nodemailer from 'nodemailer'
import cloudinary from "cloudinary";
import { jsPDF } from "jspdf";
import 'jspdf-autotable';
import { Readable } from 'stream';
import { sendWhatsAppMessage } from "../config/whatsAppConfig.js";

const sendVerifyMail = async (quotation, admin, client) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: "ptshafeeque999.com",
      to: client.email,
      subject: `Quotation Proposal from ${admin}`,
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .header {
            background-color: #2A5948;
            color: white;
            text-align: center;
            padding: 10px;
            border-radius: 8px 8px 0 0;
          }
          .content {
            margin-top: 20px;
          }
          .proposal-link {
            display: inline-block;
            background-color: #3498db;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 0.8em;
            color: #777;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Quotation Proposal</h1>
          </div>
          <div class="content">
            <p>Hello ${client.name},</p>
            
            <p>You have received a new quotation proposal from ${admin}. Please review the details below:</p>
            
            <a href="${quotation.proposal}" class="proposal-link">View Proposal</a>
            
            <p>If you cannot click the button, please copy and paste the following link into your browser:</p>
            <p>${quotation.proposal}</p>
          </div>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Your Company Name</p>
          </div>
        </div>
      </body>
      </html>
    `};

    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Email send error:", error.message);
          reject(error);
        } else {
          console.log("Email sent successfully");
          resolve(info);
        }
      });
    });
  } catch (error) {
    console.error("Email process error:", error.message);
    throw error;
  }
};


export const generateQuotationPDF = async (details) => {
  const {
    adminDetails,
    clientDetails,
    products,
    services,
    totalAmount,
    termsAndConditions,
    description,
    title,
    tax,
    taxName,
    subTotal,
    expireDate,
    qtnId,
    showPrice
  } = details;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Consistent margins on all sides
  const margin = {
    left: 15,    // Slightly reduced to create more space
    right: 15,   // Slightly reduced to create more space
    top: 15,     // Increased top margin for better spacing
    bottom: 15   // Increased bottom margin for better spacing
  };

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const colors = {
    primary: [41, 128, 185],
    secondary: [52, 152, 219],
    text: [50, 50, 50],
    background: [241, 248, 255]
  };

  // Improved page tracking and content management
  const contentSections = [];

  // Helper functions
  const addPageHeader = (pageNum) => {
    // Set header background
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 20, 'F');
  
    // Set text color to white and font for the admin name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
  
    // Calculate available width for adminDetails.name
    const padding = 5; // Left padding
    const pageNumWidth = 40; // Approx width for "Page X" text
    const availableWidth = pageWidth - padding - pageNumWidth;
  
    // Wrap the admin name text to fit within available width
    const adminNameText = doc.splitTextToSize(adminDetails.name, availableWidth);
  
    // Print admin name on the next line if necessary
    doc.text(adminNameText, padding, 12);
  
    // Add page number
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);
    doc.setFont(undefined, 'normal');
    doc.text(`Page ${pageNum}`, pageWidth - padding - 12, 17); 
  };
  

  const addCompanyLogo = async () => {
    try {
      // If logo is provided
      if (adminDetails.logo) {
        let logoImage;
  
        // If it's a base64 string
        if (adminDetails.logo.startsWith('data:')) {
          logoImage = adminDetails.logo;
        } else {
          // If it's a URL, use more robust image fetching
          try {
            const response = await fetch(adminDetails.logo, { 
              timeout: 5000,  // 5 second timeout
              method: 'GET',
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            });
  
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
  
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            logoImage = `data:image/jpeg;base64,${Buffer.from(arrayBuffer).toString('base64')}`;
          } catch (fetchError) {
            console.error('Logo fetch error:', fetchError);
            // Fallback to placeholder if fetch fails
            logoImage = null;
          }
        }
  
        // Add logo if successfully retrieved
        if (logoImage) {
          doc.addImage(
            logoImage, 
            'PNG', 
            margin.left, 
            margin.top + 20,
            40,  // width
            30   // height
          );
        } else {
          // Placeholder if no logo or fetch failed
          doc.setDrawColor(200);
          doc.setLineWidth(0.5);
          doc.rect(margin.left, margin.top + 25, 40, 30);
          doc.setFontSize(8);
          doc.text('LOGO', margin.left + 15, margin.top + 45);
        }
      } else {
        // Placeholder if no logo provided
        doc.setDrawColor(200);
        doc.setLineWidth(0.5);
        doc.rect(margin.left, margin.top + 25, 40, 30);
        doc.setFontSize(8);
        doc.text('LOGO', margin.left + 15, margin.top + 45);
      }
    } catch (error) {
      console.error('Unexpected logo addition error:', error);
      // Final fallback placeholder
      doc.setDrawColor(200);
      doc.setLineWidth(0.5);
      doc.rect(margin.left, margin.top + 25, 40, 30);
      doc.setFontSize(8);
      doc.text('LOGO', margin.left + 15, margin.top + 45);
    }
  };

  const addCompanyDetails = () => { 
    const availableWidth = pageWidth - margin.left - margin.right; // Available text width
    const lineHeight = 5; // Gap between lines
  
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);
  
    // "From" section
    doc.setFont(undefined, 'bold');
    const fromName = `From: ${adminDetails.name}`;
    const wrappedFromName = doc.splitTextToSize(fromName, availableWidth);
    doc.text(wrappedFromName, margin.left, margin.top + 70);
  
    doc.setFont(undefined, 'normal');
    let yPos = margin.top + 77; // Initialize vertical position
    const fromFields = [
      `Email: ${adminDetails.email}`,
      `Phone: ${adminDetails.phone}`,
      `Address: ${adminDetails.address.address1}`
    ];
  
    // Add address2 if exists
    if (adminDetails.address.address2) {
      fromFields.push(adminDetails.address.address2);
    }
  
    fromFields.forEach((field) => {
      const wrappedField = doc.splitTextToSize(field, availableWidth);
      doc.text(wrappedField, margin.left, yPos);
      yPos += wrappedField.length * lineHeight; // Add gap based on lines
    });
  
    // "To" section
    doc.setFont(undefined, 'bold');
    yPos += 10; // Add extra space before "To" section
    const toName = `To: ${clientDetails.name}`;
    const wrappedToName = doc.splitTextToSize(toName, availableWidth);
    doc.text(wrappedToName, margin.left, yPos);
  
    doc.setFont(undefined, 'normal');
    yPos += wrappedToName.length * lineHeight;
  
    const toFields = [
      `Email: ${clientDetails.email}`,
      `Phone: ${clientDetails.phone}`,
      `Address: ${clientDetails.address}`
    ];
  
    toFields.forEach((field) => {
      const wrappedField = doc.splitTextToSize(field, availableWidth);
      doc.text(wrappedField, margin.left, yPos);
      yPos += wrappedField.length * lineHeight; // Add gap
    });
  
    // Quotation details
    doc.setFont(undefined, 'bold');
    yPos += 10; // Add extra space before Quotation
    doc.text(`Quotation #: ${qtnId || 'N/A'}`, margin.left, yPos);
    doc.text(
      `Expire Date: ${expireDate ? new Date(expireDate).toLocaleDateString() : 'N/A'}`,
      pageWidth - margin.right - 50,
      yPos
    );
  
    // Title Section
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    yPos += 15; // Extra space before title
    const titleText = `${title || 'N/A'}`;
    const wrappedTitle = doc.splitTextToSize(titleText, availableWidth);
    doc.text(wrappedTitle, margin.left, yPos);
  };
  
  

  const createTable = (headers, data, title) => {
    const tableOptions = {
      head: [headers],
      body: data,
      theme: 'striped',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: colors.text,
        lineColor: [200, 200, 200]
      },
      headStyles: {
        fillColor: colors.secondary,
        textColor: [255, 255, 255]
      },
      margin: { left: margin.left, right: margin.right }
    };

    return { tableOptions, title };
  };

  const addProductsTable = () => {
    const productsData = products.map((product, index) => [
      index + 1,
      product.name,
      product.description,
      product.quantity,
      `$${product.price.toFixed(2)}`
    ]);

    return createTable(
      ['#', 'Name', 'Description', 'Quantity', 'Price'],
      productsData,
      'Products'
    );
  };

  const addServicesTable = () => {
    const servicesData = services.map((service, index) => [
      index + 1,
      service.name,
      service.description,
      `$${service.price.toFixed(2)}`
    ]);

    return createTable(
      ['#', 'Service Name', 'Description', 'Price'],
      servicesData,
      'Services'
    );
  };
  
  const addFinancialSummary = () => {
    const summaryData = [
      ['Total Amount', `$${totalAmount.toFixed(2)}`],
      [`${taxName}`, `$${tax.toFixed(2)}`],
      [`Subtotal`, `$${subTotal.toFixed(2)}`]
    ];

    return {
      tableOptions: {
        body: summaryData,
        theme: 'plain',
        styles: {
          fontSize: 10,
          cellPadding: 3,
          halign: 'right'
        },
        columnStyles: { 0: { fontStyle: 'bold' } },
        margin: { left: pageWidth - margin.right - 80, right: margin.right }
      },
      title: 'Financial Summary'
    };
  };

  const addTermsAndDescription = () => {
    return {
      content: (startY) => {
        doc.setFontSize(12);
        doc.setTextColor(...colors.text);
        doc.setFont(undefined, 'bold');
        doc.text('Terms and Conditions:', margin.left, startY);
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        const termsLines = doc.splitTextToSize(
          termsAndConditions || 'No specific terms provided.',
          pageWidth - margin.left - margin.right
        );
        doc.text(termsLines, margin.left, startY + 10);
  
        // Calculate and return new Y position
        const termsHeight = termsLines.length * 7; // Line height for terms
        return startY + 10 + termsHeight; // Add padding after terms
      },
      title: 'Terms and Description',
    };
  };
  
  const AddDescription = () => {
    return {
      content: (startY) => {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Description:', margin.left, startY);
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        const descLines = doc.splitTextToSize(
          description || 'No description provided.',
          pageWidth - margin.left - margin.right
        );
        doc.text(descLines, margin.left, startY + 10);
  
        // Calculate and return new Y position
        const descHeight = descLines.length * 7; // Line height for description
        return startY + 10 + descHeight + 20; // Add padding after description
      },
      title: 'Description',
    };
  };
  

  const addFooter = () => {
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text(
      `Generated on: ${new Date().toLocaleString()}`, 
      margin.left, 
      pageHeight - margin.bottom
    );
  };

  // Prepare content sections
//   contentSections.push(
//     addProductsTable(),
//     addServicesTable()
// );

if(products.length>0){
  contentSections.push(addProductsTable());
}
if(services.length>0){
  contentSections.push(addServicesTable());
}


if (showPrice) {
    contentSections.push(addFinancialSummary());
}

contentSections.push(addTermsAndDescription());
contentSections.push(AddDescription());


  // Generate PDF
  let currentPage = 1;
  addPageHeader(currentPage);
  await addCompanyLogo();
  addCompanyDetails();

  // Intelligent page management
  let currentY = margin.top + 172;
  contentSections.forEach((section, index) => {
    // Check if we need a new page
    const estimatedContentHeight = 50; // Rough estimation
    if (currentY + estimatedContentHeight > pageHeight - margin.bottom) {
      doc.addPage();
      currentPage++;
      addPageHeader(currentPage);
      currentY = margin.top + 30;
    }

    // Add table or content
    if (section.tableOptions) {
      doc.autoTable({
        ...section.tableOptions,
        startY: currentY
      });
      currentY = doc.lastAutoTable.finalY + 10;
    } else if (section.content) {
      currentY = section.content(currentY);
    }
  });

  addFooter();

  return Buffer.from(doc.output('arraybuffer'));
};



export const createQuotation = async (req, res) => { 
  try {
    const {
      products,
      services,
      totalAmount,
      expireDate,
      client,
      createdBy,
      file,
      termsAndConditions,
      description,
      title,
      tax,
      taxName,
      subTotal,
      showPrice,
      adminId,
    } = req.body;

    // Input Validation
    if (products.length === 0 && services.length === 0) {
      return res.status(400).json({ message: "Please select a product or service." });
    }

    const newProducts = [];
    for (let product of products) {
      const trimmedName = product.name.trim();
      const trimmedDescription = product.description.trim();
    
      const existingProduct = await Product.findOne({
        name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
        description: { $regex: new RegExp(`^${trimmedDescription}$`, "i") },
      });
      
      
    
      if (!existingProduct) {
        const newProduct = new Product({
          name: trimmedName,
          description: trimmedDescription,
          adminIs:adminId,
        });
        await newProduct.save();
        newProducts.push(newProduct); 
      } else {
        newProducts.push(existingProduct);
      }
    }
    
    const newServices = [];
    for (let service of services) {
      const trimmedName = service.name.trim();
      const trimmedDescription = service.description.trim();
    
      const existingService = await Service.findOne({
        name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
        description: { $regex: new RegExp(`^${trimmedDescription}$`, "i") },
      });
      

    
      if (!existingService) {
        const newService = new Service({
          name: trimmedName,
          description: trimmedDescription,
          adminIs:adminId,
        });
        await newService.save();
        newServices.push(newService); // Store the newly created service
      } else {
        newServices.push(existingService); // If it exists, use the existing service
      }
    }


    const [adminDetails, clientDetails] = await Promise.all([
      Admin.findById(adminId),
      Client.findById(client)
    ]);
    const adminName = adminDetails.name;

    if (!adminDetails) {
      return res.status(404).json({ message: "Admin not found." });
    }

    if (!clientDetails) {
      return res.status(404).json({ message: "Client not found." });
    }

    // Limit file uploads
    const uploadPromises = file.map((fileObj) => {
      if (!fileObj.base64) {
        throw new Error(`Invalid file object: ${JSON.stringify(fileObj)}`);
      }

      const fileData = fileObj.base64;

      const isPDF = fileData.startsWith("data:application/pdf");
      const resourceType = isPDF ? "auto" : "image";

      // Upload to Cloudinary
      return cloudinary.uploader.upload(fileData, {
        folder: "QuotationFile",
        resource_type: resourceType,
      });
    });

    const uploadFiles = await Promise.all(uploadPromises);
    const allFiles = uploadFiles.map((val) => val.secure_url);
    const qtnId = (await Quotation.countDocuments()) + 1000;

    // Generate PDF using the imported utility
    const pdfBuffer = await generateQuotationPDF({ 
      adminDetails, 
      clientDetails, 
      products, 
      services, 
      totalAmount, 
      termsAndConditions, 
      description, 
      title,
      tax,
      taxName,
      subTotal,
      expireDate,
      qtnId,
      showPrice
    });


    // Upload PDF with timeout
    const pdfUpload = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        { 
          resource_type: "raw",
          folder: "QuotationProposal",
          filename: `quotation_${qtnId}.pdf`
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return reject(error);
          }
          resolve(result);
        }
      );

      // Create a readable stream from the buffer
      const bufferStream = new Readable();
      bufferStream.push(pdfBuffer);
      bufferStream.push(null);
      
      bufferStream.pipe(uploadStream);
    });

    // Create quotation
    const newQuotation = new Quotation({
      products,
      services,
      expireDate,
      client,
      createdBy,
      quotationId: qtnId,
      adminIs: adminId,
      fileUrl: allFiles,
      proposal: pdfUpload.secure_url,
      ...(showPrice && {
        taxName,
        tax,
        totalAmount,
        subTotal,
      }),
    });

    const newQtn = await newQuotation.save();
    await sendVerifyMail(newQtn, adminName, clientDetails);
    // await sendWhatsAppMessage(clientDetails, newQtn, adminName);

    res.status(200).json({ 
      message: "Quotation created successfully!", 
      proposal: pdfUpload.secure_url 
    });

  } catch (error) {
    console.error("Quotation creation error:", error);
    res.status(500).json({ 
      message: "Server error.", 
      error: error.message 
    });
  }
};



export const changeQtnStatus = async (req, res) => {
    try {
        const { status,reason,qid } = req.body;
      const quotation = await Quotation.findById(qid);
      
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
  
      quotation.status = status;
      if (status === "rejected") {
        quotation.cancelReason = reason;
      }
      if(status==="accepted"){
        quotation.approvedOn = new Date();
      }
  
      await quotation.save();
  
      res.status(200).json({
        message: "Quotation status successfully updated",
        quotation,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server error" });
    }
  };


export const quotationDetails = async (req, res) => {
    try {
      const { qid } = req.params;
      const quotation = await Quotation.findById(qid)
        .populate({
          path: "createdBy",
          select: "name phone email ",
        })
        .populate({
          path: "client",
          select: "name email phone address",
        })
        .populate({
          path: "adminIs",
          select: "name email phone address"
        });
  
      res.status(200).json({ quotation });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: "Server error" });
    }
  };


