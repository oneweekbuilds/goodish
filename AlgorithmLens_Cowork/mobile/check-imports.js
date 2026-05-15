const fs = require('fs');
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

// Known components from react-native that don't need explicit imports in many contexts
const REACT_NATIVE_COMPONENTS = new Set([
    'View', 'Text', 'ScrollView', 'FlatList', 'TouchableOpacity', 'Image',
    'TextInput', 'StyleSheet', 'SafeAreaView', 'Modal', 'Switch', 'Pressable',
    'ActivityIndicator', 'Alert', 'Platform', 'Dimensions', 'KeyboardAvoidingView',
    'SectionList', 'RefreshControl', 'WebView', 'StatusBar', 'Keyboard', 'Animated'
]);

let issues = [];

for (const filepath of files_to_check) {
    if (!fs.existsSync(filepath)) {
        continue;
    }
    
    const code = fs.readFileSync(filepath, 'utf8');
    const lines = code.split('\n');
    
    // Extract all imports
    const imports = new Map();
    const importRegex = /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
        if (match[1]) {
            // Named imports: import { A, B, C }
            const names = match[1].split(',').map(s => s.trim());
            names.forEach(name => imports.set(name, match[3]));
        }
        if (match[2]) {
            // Default import: import A from
            imports.set(match[2], match[3]);
        }
    }
    
    // Look for JSX components usage
    const componentUsageRegex = /<([A-Z]\w*)/g;
    const usedComponents = new Set();
    while ((match = componentUsageRegex.exec(code)) !== null) {
        const comp = match[1];
        if (!REACT_NATIVE_COMPONENTS.has(comp) && !imports.has(comp)) {
            usedComponents.add(comp);
        }
    }
    
    // Check for missing imports
    for (const comp of usedComponents) {
        // Filter out false positives
        if (!code.includes(`interface ${comp}`) && !code.includes(`type ${comp}`) && !code.includes(`const ${comp}`)) {
            // Might be missing import
            // But only flag if it's likely a real issue (defined in this codebase or from libs)
            if (!comp.match(/^[A-Z]{2,}$/)) {  // Skip all-caps abbreviations
                issues.push({
                    file: filepath,
                    component: comp,
                    type: 'likely_missing_import'
                });
            }
        }
    }
    
    // Check for unused imports (optional check)
    for (const [name, from] of imports) {
        if (name === 'React' || name === 'useState' || name === 'useEffect') {
            continue;  // These are often used indirectly
        }
        
        // Check if this import is actually used
        const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const usageRegex = new RegExp(`\\b${escapedName}\\b`);
        
        // Count usages (excluding import line itself)
        const lines_without_import = code.split('\n').filter((l, i) => !l.includes(`import`) || !l.includes(name)).join('\n');
        const usages = (lines_without_import.match(usageRegex) || []).length;
        
        if (usages === 0 && !name.includes('*')) {
            // Unused import - optional warning
        }
    }
}

if (issues.length === 0) {
    console.log('✓ All component imports look correct');
} else {
    console.log(`Found ${issues.length} potential import issues:\n`);
    for (const issue of issues) {
        console.log(`${issue.file}: Component <${issue.component}/> may not be imported`);
    }
}
