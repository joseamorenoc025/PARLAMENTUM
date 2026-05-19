const fs = require('fs');

let code = fs.readFileSync('public/portal/app.js', 'utf8');

// Fix 1: XSS in matchScoreHtml
code = code.replace(/\$\{term\}/g, '${escapeHTML(term)}');

// Inject escapeHTML function if not present
if (!code.includes('function escapeHTML')) {
    code = code.replace('let currentView', `function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
}

let currentView`);
}

// Fix 2: Incomplete string escaping bypass
// Replace .replace(/'/g, "\\'") with .replace(/\\/g, "\\\\").replace(/'/g, "\\'")
const searchStr = ".replace(/'/g, \"\\\\'\")";
const replaceStr = ".replace(/\\\\/g, \"\\\\\\\\\").replace(/'/g, \"\\\\'\")";
code = code.split(searchStr).join(replaceStr);

fs.writeFileSync('public/portal/app.js', code);
console.log('Fixed vulnerabilities!');
