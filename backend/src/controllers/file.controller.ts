import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/database';
import { asyncHandler, NotFoundError } from '../middlewares/error.middleware';

// Get file info
export const getFileInfo = asyncHandler(async (req: Request, res: Response) => {
  const { type, id } = req.params;

  let letter;
  if (type === 'incoming') {
    letter = await prisma.incomingLetter.findUnique({
      where: { id },
      select: {
        id: true,
        fileName: true,
        filePath: true,
        letterNumber: true,
      },
    });
  } else if (type === 'outgoing') {
    letter = await prisma.outgoingLetter.findUnique({
      where: { id },
      select: {
        id: true,
        fileName: true,
        filePath: true,
        letterNumber: true,
      },
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Invalid type',
      message: 'Type must be "incoming" or "outgoing"',
    });
    return;
  }

  if (!letter) {
    throw new NotFoundError('Letter');
  }

  if (!letter.filePath || !letter.fileName) {
    res.status(404).json({
      success: false,
      error: 'No file attached',
      message: 'This letter does not have an attached file',
    });
    return;
  }

  // Check if file exists
  const filePath = path.resolve(letter.filePath);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({
      success: false,
      error: 'File not found',
      message: 'The file could not be found on the server',
    });
    return;
  }

  const stats = fs.statSync(filePath);
  const extension = path.extname(letter.fileName).toLowerCase();

  let mimeType = 'application/octet-stream';
  if (extension === '.pdf') mimeType = 'application/pdf';
  else if (extension === '.doc') mimeType = 'application/msword';
  else if (extension === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  else if (extension === '.jpg' || extension === '.jpeg') mimeType = 'image/jpeg';
  else if (extension === '.png') mimeType = 'image/png';

  res.json({
    success: true,
    data: {
      id: letter.id,
      letterNumber: letter.letterNumber,
      fileName: letter.fileName,
      fileSize: stats.size,
      mimeType,
    },
  });
});

// Download file
export const downloadFile = asyncHandler(async (req: Request, res: Response) => {
  const { type, id } = req.params;

  let letter;
  if (type === 'incoming') {
    letter = await prisma.incomingLetter.findUnique({
      where: { id },
      select: {
        fileName: true,
        filePath: true,
      },
    });
  } else if (type === 'outgoing') {
    letter = await prisma.outgoingLetter.findUnique({
      where: { id },
      select: {
        fileName: true,
        filePath: true,
      },
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Invalid type',
      message: 'Type must be "incoming" or "outgoing"',
    });
    return;
  }

  if (!letter) {
    throw new NotFoundError('Letter');
  }

  if (!letter.filePath || !letter.fileName) {
    res.status(404).json({
      success: false,
      error: 'No file attached',
      message: 'This letter does not have an attached file',
    });
    return;
  }

  const filePath = path.resolve(letter.filePath);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({
      success: false,
      error: 'File not found',
      message: 'The file could not be found on the server',
    });
    return;
  }

  res.download(filePath, letter.fileName);
});

// Preview file (for PDFs and images)
export const previewFile = asyncHandler(async (req: Request, res: Response) => {
  const { type, id } = req.params;

  let letter;
  if (type === 'incoming') {
    letter = await prisma.incomingLetter.findUnique({
      where: { id },
      select: {
        fileName: true,
        filePath: true,
      },
    });
  } else if (type === 'outgoing') {
    letter = await prisma.outgoingLetter.findUnique({
      where: { id },
      select: {
        fileName: true,
        filePath: true,
      },
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Invalid type',
      message: 'Type must be "incoming" or "outgoing"',
    });
    return;
  }

  if (!letter) {
    throw new NotFoundError('Letter');
  }

  if (!letter.filePath || !letter.fileName) {
    res.status(404).json({
      success: false,
      error: 'No file attached',
      message: 'This letter does not have an attached file',
    });
    return;
  }

  const filePath = path.resolve(letter.filePath);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({
      success: false,
      error: 'File not found',
      message: 'The file could not be found on the server',
    });
    return;
  }

  const extension = path.extname(letter.fileName).toLowerCase();
  
  let mimeType = 'application/octet-stream';
  if (extension === '.pdf') mimeType = 'application/pdf';
  else if (extension === '.jpg' || extension === '.jpeg') mimeType = 'image/jpeg';
  else if (extension === '.png') mimeType = 'image/png';
  else {
    // For non-previewable files, redirect to download
    res.download(filePath, letter.fileName);
    return;
  }

  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${letter.fileName}"`);
  fs.createReadStream(filePath).pipe(res);
});

// Delete file (removes file attachment from letter)
export const deleteFile = asyncHandler(async (req: Request, res: Response) => {
  const { type, id } = req.params;

  let letter;
  if (type === 'incoming') {
    letter = await prisma.incomingLetter.findUnique({
      where: { id },
      select: {
        filePath: true,
      },
    });
  } else if (type === 'outgoing') {
    letter = await prisma.outgoingLetter.findUnique({
      where: { id },
      select: {
        filePath: true,
      },
    });
  } else {
    res.status(400).json({
      success: false,
      error: 'Invalid type',
      message: 'Type must be "incoming" or "outgoing"',
    });
    return;
  }

  if (!letter) {
    throw new NotFoundError('Letter');
  }

  if (!letter.filePath) {
    res.status(404).json({
      success: false,
      error: 'No file attached',
      message: 'This letter does not have an attached file',
    });
    return;
  }

  // Delete the file from disk
  const filePath = path.resolve(letter.filePath);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Update the letter to remove file reference
  if (type === 'incoming') {
    await prisma.incomingLetter.update({
      where: { id },
      data: {
        fileName: null,
        filePath: null,
      },
    });
  } else {
    await prisma.outgoingLetter.update({
      where: { id },
      data: {
        fileName: null,
        filePath: null,
      },
    });
  }

  res.json({
    success: true,
    message: 'File deleted successfully',
  });
});
