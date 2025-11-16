// Final verification that the code changes were actually implemented
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function verifyImplementation() {
  console.log('🔍 Final Verification of Code Changes\n');
  
  const checks = [
    {
      name: 'Message Repository - forwardMessage method',
      file: 'modules/message/message.repository.ts',
      pattern: 'async forwardMessage('
    },
    {
      name: 'Message Service - forwardMessage method',
      file: 'modules/message/message.service.ts',
      pattern: 'async forwardMessage('
    },
    {
      name: 'Message Controller - forwardMessage method',
      file: 'modules/message/message.controller.ts',
      pattern: 'async forwardMessage('
    },
    {
      name: 'Message Routes - forward route',
      file: 'modules/message/message.routes.ts',
      pattern: 'forward'
    },
    {
      name: 'Message Validation - forwardMessageSchema',
      file: 'modules/message/message.validation.ts',
      pattern: 'forwardMessageSchema'
    },
    {
      name: 'Enhanced Reactions - extendedEmojiSet',
      file: 'modules/message/message.validation.ts',
      pattern: 'extendedEmojiSet'
    },
    {
      name: 'Enhanced Reactions - getMessageReactions service',
      file: 'modules/message/message.service.ts',
      pattern: 'getMessageReactions'
    },
    {
      name: 'Enhanced Reactions - getUserReaction service',
      file: 'modules/message/message.service.ts',
      pattern: 'getUserReaction'
    }
  ];

  let passed = 0;
  const total = checks.length;

  for (const check of checks) {
    try {
      const filePath = join(process.cwd(), check.file);
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf-8');
        if (content.includes(check.pattern)) {
          console.log(`✅ ${check.name}`);
          passed++;
        } else {
          console.log(`❌ ${check.name} (pattern not found)`);
        }
      } else {
        console.log(`❌ ${check.name} (file not found: ${check.file})`);
      }
    } catch (error) {
      console.log(`❌ ${check.name} (error: ${error})`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Results: ${passed}/${total} checks passed`);
  console.log('='.repeat(50));
  
  if (passed === total) {
    console.log('🎉 All code changes have been successfully implemented!');
  } else {
    console.log('⚠️  Some implementations may be missing or incomplete.');
  }
}

verifyImplementation();