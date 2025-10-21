import bcrypt from 'bcrypt';

const password = process.argv[2];

if (!password) {
  console.log('Usage: ts-node hashPassword.ts <password>');
  process.exit(1);
}

const saltRounds = 10;
bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    process.exit(1);
  }
  console.log('Password hash:');
  console.log(hash);
  process.exit(0);
});
