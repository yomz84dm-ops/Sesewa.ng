git fetch origin
git reset --hard origin/main
echo "node_modules/
.cache/
.cloudcode/
dist/
build/
.env*" > .gitignore
# Add your source code and config files
git add src/
git add public/
git add package.json
git add package-lock.json
git add vite.config.ts
git add .gitignore
# DO NOT use 'git add .' if you aren't sure what's in the other folders.
git commit -m "chore: clean repository and add package-lock.json"
git push origin main
git config --global user.email "yomz84.dm@gmail.com"
git config --global user.name "Abayomi Shobowale"
# 1. Finalize the commit
git commit -m "chore: clean repository and add package-lock.json"
# 2. Push to GitHub
git push origin main
# 1. Finalize the commit
git commit -m "chore: clean repository and add package-lock.json"
# 2. Push to GitHub
git push origin main
git config --global user.email "yomz84.dm@gmail.com"
git config --global user.name "Abayomi Shobowale"
# 1. Finalize the commit
git commit -m "chore: clean repository and add package-lock.json"
# 2. Push to GitHub
git push origin main
cd Sesewa.ng
# Add the missing lockfile
git add package-lock.json
# If you haven't added your source changes yet:
git add src/
git add package.json
git commit -m "chore: add package-lock.json and fix dependencies"
git push origin main
git push origin main --force
# This force-updates the lockfile to match your package.json
npm install
# 1. Add the newly updated lockfile
git add package-lock.json
# 2. Commit the changes
git commit -m "fix: sync package-lock.json and resolve version mismatches"
# 3. Push to GitHub
git push origin main
rm .git/hooks/post-commit
rm .git/hooks/pre-push
git push origin main --force
// Look for where this variable is created twice:
const hostIsDevOrPreview = ... 
// ... later in the same scope ...
const hostIsDevOrPreview = ... // <--- REMOVE or RENAME this second declaration
