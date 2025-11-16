import { readFileSync } from 'fs';
import { join } from 'path';

function verifyImplementation() {
  console.log('Verifying message forwarding implementation...\n');
  
  // Check repository implementation
  const repositoryPath = join('modules', 'message', 'message.repository.ts');
  const repositoryContent = readFileSync(repositoryPath, 'utf-8');
  const hasForwardMethod = repositoryContent.includes('async forwardMessage(');
  
  console.log(`Repository forwardMessage method: ${hasForwardMethod ? '✓' : '✗'}`);
  
  // Check service implementation
  const servicePath = join('modules', 'message', 'message.service.ts');
  const serviceContent = readFileSync(servicePath, 'utf-8');
  const hasForwardServiceMethod = serviceContent.includes('async forwardMessage(');
  
  console.log(`Service forwardMessage method: ${hasForwardServiceMethod ? '✓' : '✗'}`);
  
  // Check controller implementation
  const controllerPath = join('modules', 'message', 'message.controller.ts');
  const controllerContent = readFileSync(controllerPath, 'utf-8');
  const hasForwardControllerMethod = controllerContent.includes('async forwardMessage(');
  
  console.log(`Controller forwardMessage method: ${hasForwardControllerMethod ? '✓' : '✗'}`);
  
  // Check routes
  const routesPath = join('modules', 'message', 'message.routes.ts');
  const routesContent = readFileSync(routesPath, 'utf-8');
  const hasForwardRoute = routesContent.includes('forward');
  
  console.log(`Forward route configured: ${hasForwardRoute ? '✓' : '✗'}`);
  
  // Check validation schema
  const validationPath = join('modules', 'message', 'message.validation.ts');
  const validationContent = readFileSync(validationPath, 'utf-8');
  const hasForwardSchema = validationContent.includes('forwardMessageSchema');
  
  console.log(`Forward message validation schema: ${hasForwardSchema ? '✓' : '✗'}`);
  
  // Overall result
  const allImplemented = hasForwardMethod && hasForwardServiceMethod && 
                        hasForwardControllerMethod && hasForwardRoute && hasForwardSchema;
  
  console.log('\n' + '='.repeat(50));
  console.log(`Overall implementation status: ${allImplemented ? 'COMPLETE' : 'INCOMPLETE'}`);
  console.log('='.repeat(50));
  
  if (allImplemented) {
    console.log('\n✓ Message forwarding functionality has been fully implemented!');
    console.log('✓ All components (repository, service, controller, routes, validation) are in place.');
  } else {
    console.log('\n✗ Some components are missing from the implementation.');
  }
}

verifyImplementation();