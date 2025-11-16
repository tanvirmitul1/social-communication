const { exec } = require('child_process');

// Function to execute git commands
function runGitCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔍 ${description}...`);
    exec(`git ${command}`, { cwd: 'd:\\projects\\social-communication' }, (error, stdout, stderr) => {
      if (error) {
        console.log(`❌ Error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.log(`⚠️  Stderr: ${stderr}`);
      }
      if (stdout) {
        console.log(`✅ Output: ${stdout.trim()}`);
      }
      resolve(stdout);
    });
  });
}

// Main function to commit changes
async function commitChanges() {
  try {
    console.log('📦 Starting git commit process...\n');
    
    // Check git status
    await runGitCommand('status --porcelain', 'Checking git status');
    
    // Add all changes
    await runGitCommand('add .', 'Staging all changes');
    
    // Commit with a descriptive message
    const commitMessage = 'feat: Implement message forwarding and enhanced reactions with comprehensive database seeding';
    await runGitCommand(`commit -m "${commitMessage}"`, 'Committing changes');
    
    console.log('\n🎉 Git commit completed successfully!');
    console.log('\n📝 Commit message:');
    console.log(`   ${commitMessage}`);
    
  } catch (error) {
    console.log(`\n❌ Git commit process failed: ${error.message}`);
  }
}

// Run the commit process
commitChanges();