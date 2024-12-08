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


export const generateQuotationPDF = (details) => {
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
    left: 20,
    right: 20,
    top: 20,
    bottom: 20
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
    doc.setFillColor(...colors.primary);
    doc.rect(margin.left, margin.top, pageWidth - margin.left - margin.right, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(title, margin.left + 5, margin.top + 12);
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);
    doc.setFont(undefined, 'normal');
    doc.text(`Page ${pageNum}`, pageWidth - margin.right - 20, margin.top + 10);
  };

  const addCompanyLogo = () => {
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.rect(margin.left, margin.top + 25, 40, 30);
    doc.setFontSize(8);
    doc.text('LOGO', margin.left + 15, margin.top + 45);
  };

  const addCompanyDetails = () => {
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);
    doc.setFont(undefined, 'bold');
    doc.text(adminDetails.name, margin.left, margin.top + 70);
    doc.setFont(undefined, 'normal');
    doc.text(`Email: ${adminDetails.email}`, margin.left, margin.top + 77);
    doc.text(`Phone: ${adminDetails.phone}`, margin.left, margin.top + 84);
    doc.text(`Address: ${adminDetails.address.address1}`, margin.left, margin.top + 91);
    if (adminDetails.address.address2) {
      doc.text(adminDetails.address.address2, margin.left, margin.top + 98);
    }

    const rightColumnX = pageWidth / 2 + margin.left;
    doc.setFont(undefined, 'bold');
    doc.text('Bill To:', rightColumnX, margin.top + 70);
    doc.text(clientDetails.name, rightColumnX, margin.top + 77);
    doc.setFont(undefined, 'normal');
    doc.text(`Email: ${clientDetails.email}`, rightColumnX, margin.top + 84);
    doc.text(`Phone: ${clientDetails.phone}`, rightColumnX, margin.top + 91);
    doc.text(`Address: ${clientDetails.address}`, rightColumnX, margin.top + 98);

    doc.setFont(undefined, 'bold');
    doc.text(`Quotation #: ${qtnId || 'N/A'}`, margin.left, margin.top + 110);
    doc.text(
      `Expire Date: ${expireDate ? new Date(expireDate).toLocaleDateString() : 'N/A'}`,
      pageWidth - margin.right - 50,
      margin.top + 110
    );
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
        const termsHeight = termsLines.length * 7;
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Description:', margin.left, startY + termsHeight + 20);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const descLines = doc.splitTextToSize(
          description || 'No description provided.',
          pageWidth - margin.left - margin.right
        );
        doc.text(descLines, margin.left, startY + termsHeight + 30);
        
        return startY + termsHeight + descLines.length * 7 + 40;
      },
      title: 'Terms and Description'
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


  // Generate PDF
  let currentPage = 1;
  addPageHeader(currentPage);
  addCompanyLogo();
  addCompanyDetails();

  // Intelligent page management
  let currentY = margin.top + 130;
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
    const pdfBuffer = generateQuotationPDF({ 
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
    // await sendVerifyMail(newQtn, adminName, clientDetails);
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


