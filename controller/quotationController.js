import User from "../model/userModel.js";
import Client from "../model/clientModel.js";
import Quotation from "../model/quotationModel.js";
import Product from "../model/productModel.js";
import Service from "../model/serviceModel.js";
import Admin from "../model/adminModel.js";
import nodemailer from "nodemailer";
import cloudinary from "../util/cloudinary.js";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Readable } from "stream";
import { sendWhatsAppMessage } from "../config/whatsAppConfig.js";
import pdf from "html-pdf";
import puppeteer from "puppeteer";
import fetch from "node-fetch";

const convertHtmlToPdf = async (htmlContent) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent);
  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();
  return pdfBuffer;
};

export const sendProposalEmail = async (req, res) => {
  try {
    const {qId,emails} = req.body;
    const quotation = await Quotation.findById(qId);
    await sendQuotationMail(quotation,emails);
    res.status(200).json({message:"Emails sent successfully"})

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateQuotationDetails = async (req, res) => {
  try {
    const {
      products,
      services,
      totalAmount,
      expireDate,
      client,
      termsAndConditions,
      description,
      title,
      tax,
      taxName,
      subTotal,
      showPrice,
      selectedCompany,
      qid, // Quotation ID to update
    } = req.body;

    // Input Validation
    if (products.length === 0 && services.length === 0) {
      return res
        .status(400)
        .json({ message: "Please select a product or service." });
    }

    // Find Existing Quotation
    const quotation = await Quotation.findById(qid);
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found." });
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
          adminIs: quotation.adminIs,
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
          adminIs: quotation.adminIs,
        });
        await newService.save();
        newServices.push(newService);
      } else {
        newServices.push(existingService);
      }
    }

    const [adminDetails, clientDetails] = await Promise.all([
      Admin.findById(quotation.adminIs),
      Client.findById(client),
    ]);

    if (!adminDetails) {
      return res.status(404).json({ message: "Admin not found." });
    }
    if (!clientDetails) {
      return res.status(404).json({ message: "Client not found." });
    }

    // Remove Old PDF from Cloudinary
    if (quotation.publicId) {
      await cloudinary.uploader.destroy(quotation.publicId, {
        resource_type: "image",
      });
    }

    const createdOn = quotation?.createdAt;

    // Generate PDF
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
      qtnId: quotation.quotationId,
      showPrice,
      createdOn,
      selectedCompany,
    });

    // Upload Updated PDF
    const pdfUpload = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          // Change resource_type to "image" instead of "raw"
          resource_type: "image",
          folder: "QuotationProposal",
          // Convert first page of PDF to image
          format: "pdf",
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return reject(error);
          }
          resolve(result);
        }
      );

      const bufferStream = new Readable();
      bufferStream.push(pdfBuffer);
      bufferStream.push(null);

      bufferStream.pipe(uploadStream);
    });

    // Update Existing Quotation
    quotation.products = products;
    quotation.services = services;
    quotation.expireDate = expireDate;
    quotation.client = client;
    quotation.proposal = pdfUpload.secure_url;
    quotation.publicId = pdfUpload.public_id;
    let CompData = {
      name: selectedCompany.name,
      email: selectedCompany.email,
      phone: selectedCompany.phone,
      address: selectedCompany.address,
    };
    quotation.company = CompData;

    if (showPrice) {
      quotation.taxName = taxName;
      quotation.tax = tax;
      quotation.totalAmount = totalAmount;
      quotation.subTotal = subTotal;
    }

    await quotation.save();

    // Send Email
    const adminName = adminDetails.name;

    res.status(200).json({
      message: "Quotation updated successfully!",
      quotation,
    });
  } catch (error) {
    console.error("Quotation update error:", error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

const sendQuotationMail = async (quotation, emails) => {
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

    // Fetch PDF as buffer if needed, or use a file path
    const pdfBuffer = await fetch(quotation.proposal).then((res) =>
      res.buffer()
    );

    const mailOptions = {
      from: "qmsalfarooq.com",
      to: emails,
      subject: `📊 Proposal from ${quotation?.company?.name} - Review Requested`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
          <style>
            body {
              font-family: 'Inter', sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 0;
              background: #f8fafc;
              color: #1e293b;
            }
            
            .wrapper {
              max-width: 650px;
              margin: 0 auto;
              padding: 20px;
            }
            
            .container {
              background: linear-gradient(145deg, #ffffff, #f8fafc);
              border-radius: 16px;
              padding: 2rem;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
                         0 8px 10px -6px rgba(0, 0, 0, 0.1);
            }
            
            .header {
              background: linear-gradient(135deg, #0ea5e9, #2563eb);
              margin: -2rem -2rem 2rem -2rem;
              padding: 2rem;
              border-radius: 16px 16px 0 0;
              text-align: center;
            }
            
            .header h1 {
              color: #ffffff;
              font-size: 28px;
              margin: 0;
            }
            
            .content {
              padding: 1rem 0;
            }
            
            .highlight-box {
              background: rgba(59, 130, 246, 0.05);
              border-left: 4px solid #3b82f6;
              padding: 1.5rem;
              margin: 1.5rem 0;
              border-radius: 0 8px 8px 0;
            }
            
            .proposal-button {
              display: inline-block;
              background: linear-gradient(135deg, #0ea5e9, #2563eb);
              color: white;
              padding: 1rem 2rem;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 500;
            }
            
            .footer {
              margin-top: 2rem;
              text-align: center;
              font-size: 0.875rem;
              color: #64748b;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1>Proposal</h1>
              </div>
              <div class="content">
                <p>Dear Valued Partner,</p>
                <p>We are pleased to share a detailed quotation proposal from <strong>${
                  quotation?.company?.name
                }</strong>, designed to meet your requirements.</p>
                <p>Please review the proposal by clicking the link below or by opening the attached PDF file:</p>
                <center>
                  <a href="${
                    quotation.proposal
                  }" class="proposal-button">Review Full Proposal</a>
                </center>
              </div>
              <div class="footer">
                <p>This proposal is confidential and intended for the recipient only.</p>
                <p>© ${new Date().getFullYear()} QMS Solutions. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: "proposal.pdf",
          content: pdfBuffer, // Attach PDF as a buffer
          contentType: "application/pdf",
        },
      ],
    };

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
    console.log("Email process error:", error.message);
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
    showPrice,
    createdOn,
    selectedCompany,
  } = details;

  const formatTextAreaContent = (text) => {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br>");
  };

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quotation #${qtnId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap');
    
    :root {
      --primary-color: #1a56db;
      --secondary-color: #2563eb;
      --accent-color: #3b82f6;
      --text-color: #111827;
      --text-secondary: #4b5563;
      --border-color: #e5e7eb;
      --background-light: #f3f4f6;
      --box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
      --border-radius: 6px;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: A4;
      margin: 20mm 20mm 20mm 20mm;
    }

    body {
      font-family: 'Open Sans', sans-serif;
      line-height: 1.5;
      color: var(--text-color);
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      font-size: 14px;
      background-color: #ffffff;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 0;
      margin-bottom: 30px;
      border-bottom: 2px solid var(--border-color);
    }

    .header h1 {
      color: var(--primary-color);
      font-weight: 600;
      font-size: 24px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .logo {
      max-width: 150px;
      max-height: 80px;
      object-fit: contain;
    }

    .quotation-details {
      background: var(--background-light);
      padding: 15px 20px;
      border-radius: var(--border-radius);
      margin-bottom: 30px;
      font-size: 13px;
      color: var(--text-secondary);
    }

    .quotation-title {
      color: var(--primary-color);
      font-weight: 600;
      text-align: center;
      font-size: 20px;
      margin: 20px 0;
      letter-spacing: 0.5px;
    }

    .contact-details {
      display: flex;
      justify-content: space-between;
      gap: 30px;
      margin-bottom: 30px;
    }

    .contact-section {
      width: 48%;
      padding: 20px;
      background: #ffffff;
      border-radius: var(--border-radius);
      border: 1px solid var(--border-color);
    }

    .section-title {
      font-weight: 600;
      margin-bottom: 15px;
      margin-top: 15px;
      color: var(--primary-color);
      font-size: 16px;
      border-bottom: 2px solid var(--border-color);
      padding-bottom: 8px;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: 13px;
    }

    .table th, .table td {
      padding: 12px 15px;
      text-align: left;
      border: 1px solid var(--border-color);
    }

    .table th {
      background: var(--background-light);
      color: var(--text-color);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 0.5px;
    }

    .table tbody tr:nth-child(even) {
      background-color: var(--background-light);
    }

    .financial-summary {
      margin-left: auto;
      width: 300px;
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      margin-bottom: 30px;
    }

    .financial-summary .table {
      margin-bottom: 0;
    }

    .financial-summary .table td {
      padding: 10px 15px;
    }

    .financial-summary .table tr:last-child {
      background: var(--background-light);
      font-weight: 600;
    }

    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 12px;
      color: var(--text-secondary);
      padding-top: 20px;
      border-top: 1px solid var(--border-color);
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="${
      selectedCompany?.logo || "/placeholder-logo.png"
    }" alt="Company Logo" class="logo">
    <h1>Quotation</h1>
  </div>

  <div class="quotation-details">
    <div>Quotation #: ${qtnId || "N/A"}</div>
    <div>Date Created: ${
      createdOn ? new Date(createdOn).toLocaleDateString() : "N/A"
    }</div>
    <div>Expiration Date: ${
      expireDate ? new Date(expireDate).toLocaleDateString() : "N/A"
    }</div>
  </div>
    
  <div class="quotation-title"> 
    ${title || "Business Proposal"}
  </div>

  <div class="contact-details">
    <div class="contact-section">
      <div class="section-title">From</div>
      <div>${selectedCompany.name}</div>
      <div>Email: ${selectedCompany.email}</div>
      <div>Phone: ${selectedCompany.phone}</div>
      <div>Address: ${selectedCompany.address}</div>
    </div>
    <div class="contact-section">
      <div class="section-title">To</div>
      <div>${clientDetails.name}</div>
      <div>Email: ${clientDetails.email}</div>
      <div>Phone: ${clientDetails.phone}</div>
      <div>Address: ${clientDetails.address}</div>
    </div>
  </div>

  ${
    products.length > 0
      ? `
  <div class="section-title">Products</div>
  <table class="table">
    <thead>
      <tr>
        <th>#</th>
        <th>Name</th>
        <th>Description</th>
        <th>Quantity</th>
        <th>Price</th>
      </tr>
    </thead>
    <tbody>
      ${products
        .map(
          (product, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${product.name}</td>
          <td>${product.description}</td>
          <td>${product.quantity}</td>
          <td>${product.price.toFixed(2)}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>
  `
      : ""
  }

  ${
    services.length > 0
      ? `
  <div class="section-title">Services</div>
  <table class="table">
    <thead>
      <tr>
        <th>#</th>
        <th>Service Name</th>
        <th>Description</th>
        <th>Price</th>
      </tr>
    </thead>
    <tbody>
      ${services
        .map(
          (service, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${service.name}</td>
          <td>${service.description}</td>
          <td>${service.price.toFixed(2)}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>
  `
      : ""
  }

  ${
    showPrice
      ? `
  <div class="financial-summary">
    <table class="table">
      <tbody>
        <tr>
          <td>Total</td>
          <td>${totalAmount.toFixed(2)}</td>
        </tr>
        <tr>
          <td>${taxName}</td>
          <td>${tax.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Total Tax</td>
          <td>${((totalAmount*tax)/100).toFixed(2)}</td>
        </tr>
        <tr>
          <td>SubTotal</td>
          <td>${subTotal.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  </div>
  `
      : ""
  }

  ${
    termsAndConditions
      ? `
    <div class="section-title">Terms and Conditions</div>
    <p>${formatTextAreaContent(termsAndConditions)}</p>
  `
      : ""
  }
    
  ${
    description
      ? `
    <div class="section-title">Description</div>
    <p>${formatTextAreaContent(description)}</p>
  `
      : ""
  }

  <div class="footer">
    Generated on: ${new Date().toLocaleString()}
  </div>
</body>
</html>
  `;

  const pdfBuffer = await convertHtmlToPdf(htmlContent);
  return pdfBuffer;
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
      selectedCompany,
      adminId,
    } = req.body;

    // Input Validation
    if (products.length === 0 && services.length === 0) {
      return res
        .status(400)
        .json({ message: "Please select a product or service." });
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
          adminIs: adminId,
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
          adminIs: adminId,
        });
        await newService.save();
        newServices.push(newService); // Store the newly created service
      } else {
        newServices.push(existingService); // If it exists, use the existing service
      }
    }

    const [adminDetails, clientDetails] = await Promise.all([
      Admin.findById(adminId),
      Client.findById(client),
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

      // Upload to Cloudinary with a specific folder
      return cloudinary.uploader.upload(fileData, {
        folder: "QuotationFile", // Ensure this parameter is correct
        resource_type: "auto", // Let Cloudinary auto-detect the file type
      });
    });

    const uploadFiles = await Promise.all(uploadPromises);
    const allFiles = uploadFiles.map((val) => val.secure_url);
    const qtnId =
      (await Quotation.find({ adminIs: adminId }).countDocuments()) + 1000;
    const createdOn = new Date();
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
      showPrice,
      createdOn,
      selectedCompany,
    });

    // Upload PDF with timeout
    const pdfUpload = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          // Change resource_type to "image" instead of "raw"
          resource_type: "image",
          folder: "QuotationProposal",
          // Convert first page of PDF to image
          format: "pdf",
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return reject(error);
          }
          resolve(result);
        }
      );

      const bufferStream = new Readable();
      bufferStream.push(pdfBuffer);
      bufferStream.push(null);

      bufferStream.pipe(uploadStream);
    });

    // Generate URL for the first page of the PDF as an image
    const pdfPreviewUrl = pdfUpload.secure_url;
    let CompData = {
      name: selectedCompany.name,
      email: selectedCompany.email,
      phone: selectedCompany.phone,
      address: selectedCompany.address,
    };

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
      company: CompData,
      proposal: pdfPreviewUrl,
      publicId: pdfUpload.public_id,
      ...(showPrice && {
        taxName,
        tax,
        totalAmount,
        subTotal,
      }),
    });

    const newQtn = await newQuotation.save();

    // await sendWhatsAppMessage(clientDetails, newQtn, adminName);

    res.status(200).json({
      message: "Quotation created successfully!",
      proposal: pdfUpload.secure_url,
    });
  } catch (error) {
    console.error("Quotation creation error:", error);
    res.status(500).json({
      message: "Server error.",
      error: error.message,
    });
  }
};

export const changeQtnStatus = async (req, res) => {
  try {
    const { status, reason, qid, admin } = req.body;

    const quotation = await Quotation.findById(qid).populate({
      path: "client",
      select: "name email phone address",
    })
    .populate({
      path: "adminIs",
      select: "name email phone address",
    })
    .populate({
      path: "company",
    });

    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    quotation.status = status;
    if (status === "rejected") {
      quotation.cancelReason = reason;
    }
    if (status === "accepted") {
      quotation.approvedOn = new Date();
    }
    quotation.statusChangedBy = {name:admin.name,email:admin.email}

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
        path: "client",
        select: "name email phone address",
      })
      .populate({
        path: "adminIs",
        select: "name email phone address",
      });

    res.status(200).json({ quotation });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
};
