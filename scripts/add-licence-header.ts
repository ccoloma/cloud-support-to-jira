import fs from 'fs';
import path from 'path';

const header = `/*!
 * Copyright (c) 2025 Carlos Coloma Escribano
 *
 * This source code is available under a dual licensing model:
 *
 * 1. LICENSE.txt — Public license: permits inspection and internal evaluation only.
 * 2. LICENSE-CHOICE.md — Commercial license: required for any production or commercial use.
 *
 */`;

const headerLines = header.split('\n').map((line) => line.trim());
const targetExtension = '.ts';

function hasHeader(content: string) {
  return headerLines.every((line) => content.includes(line));
}

function shouldIgnore(filePath: string) {
  return filePath.endsWith('.test.ts');
}

function addHeaderToFile(filePath: string) {
  if (shouldIgnore(filePath)) {
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  if (!hasHeader(content)) {
    const updatedContent = `${header}\n\n${content}`;
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    console.log(`✔️  Header added to ${filePath}`);
  }
}

function checkFilesLicenseHeader(dir = '.') {
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
        checkFilesLicenseHeader(fullPath);
      }
    } else if (file.endsWith(targetExtension)) {
      addHeaderToFile(fullPath);
    }
  }
}

checkFilesLicenseHeader();
