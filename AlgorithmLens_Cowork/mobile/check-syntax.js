const fs = require('fs');
const parser = require('@babel/parser');
const path = require('path');

const files_to_check = [
    "./app/(auth)/login.tsx",
    "./app/(auth)/onboarding.tsx",
    "./app/(tabs)/dashboard.tsx",
    "./app/(tabs)/history.tsx",
    "./app/(tabs)/index.tsx",
    "./app/(tabs)/settings.tsx",
    "./app/(tabs)/_layout.tsx",
    "./app/analysis/[sessionId].tsx",
    "./app/broadcast/[platform].tsx",
    "./app/scanner/[platform].tsx",
    "./app/checkout/success.tsx",
    "./app/checkout/cancel.tsx",
    "./app/_layout.tsx",
    "./app/(auth)/_layout.tsx",
];

let syntax_issues = [];

for (const filepath of files_to_check) {
    if (!fs.existsSync(filepath)) {
        console.log(`File not found: ${filepath}`);
        continue;
    }
    
    try {
        const code = fs.readFileSync(filepath, 'utf8');
        parser.parse(code, {
            sourceType: 'module',
            allowImportExportEverywhere: true,
            allowReturnOutsideFunction: true,
            plugins: [
                'jsx',
                'typescript',
                'decorators-legacy',
                'logicalAssignment',
            ],
        });
        console.log(`✓ ${filepath}`);
    } catch (error) {
        syntax_issues.push({
            file: filepath,
            line: error.loc?.line || 'unknown',
            column: error.loc?.column || 'unknown',
            message: error.message,
        });
    }
}

if (syntax_issues.length === 0) {
    console.log('\nSUCCESS: All TSX files parse correctly!');
} else {
    console.log(`\nFound ${syntax_issues.length} syntax errors:\n`);
    for (const issue of syntax_issues) {
        console.log(`${issue.file}:${issue.line}:${issue.column}`);
        console.log(`  ${issue.message}\n`);
    }
}
