// One-time, mechanical JSX localization preparation and repeatable source extraction.
import ts from 'typescript';
import fs from 'node:fs';
const files = ['app/HomePage.tsx', 'app/components/SiteChrome.tsx', 'app/components/MascotVignette.tsx'];
const visibleProps = new Set(['alt', 'aria-label', 'title', 'description', 'label', 'note']);
const sources = new Set();
const add = (text) => { const value = text.replace(/\s+/g, ' ').trim(); if (/[A-Za-z]/.test(value) && !value.startsWith('/') && !value.startsWith('http')) sources.add(value); };
for (const file of files) {
  const input = fs.readFileSync(file, 'utf8');
  const source = ts.createSourceFile(file, input, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const collect = (node) => {
    if (ts.isJsxText(node)) add(node.text);
    if (ts.isJsxAttribute(node) && visibleProps.has(node.name.getText(source)) && node.initializer && ts.isStringLiteral(node.initializer)) add(node.initializer.text);
    if (ts.isStringLiteral(node) && ts.isJsxExpression(node.parent)) add(node.text);
    ts.forEachChild(node, collect);
  };
  collect(source);
  if (process.argv.includes('--convert') && !input.includes('useWebsiteLocale')) {
    const result = ts.transform(source, [(context) => {
      const f = context.factory;
      const call = (value) => f.createCallExpression(f.createIdentifier('t'), undefined, [value]);
      const visit = (node) => {
        if (ts.isJsxText(node)) {
          const normalized = node.text.replace(/\s+/g, ' ');
          if (!normalized.trim()) return node;
          return f.createJsxExpression(undefined, call(f.createStringLiteral(normalized)));
        }
        if (ts.isJsxAttribute(node) && visibleProps.has(node.name.getText(source)) && node.initializer) {
          if (ts.isStringLiteral(node.initializer)) return f.updateJsxAttribute(node, node.name, f.createJsxExpression(undefined, call(node.initializer)));
          if (ts.isJsxExpression(node.initializer) && node.initializer.expression) return f.updateJsxAttribute(node, node.name, f.createJsxExpression(undefined, call(ts.visitNode(node.initializer.expression, visit))));
        }
        if (ts.isJsxExpression(node) && node.expression && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) return f.updateJsxExpression(node, call(ts.visitNode(node.expression, visit)));
        let updated = ts.visitEachChild(node, visit, context);
        if (ts.isFunctionDeclaration(updated) && updated.body) {
          let jsx = false;
          const find = (n) => { if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n)) jsx = true; ts.forEachChild(n, find); };
          find(node.body);
          if (jsx) updated = f.updateFunctionDeclaration(updated, updated.modifiers, updated.asteriskToken, updated.name, updated.typeParameters, updated.parameters, updated.type, f.updateBlock(updated.body, [f.createVariableStatement(undefined, f.createVariableDeclarationList([f.createVariableDeclaration(f.createObjectBindingPattern(['t'].map((name) => f.createBindingElement(undefined, undefined, name))), undefined, undefined, f.createCallExpression(f.createIdentifier('useWebsiteLocale'), undefined, []))], ts.NodeFlags.Const)), ...updated.body.statements]));
        }
        return updated;
      };
      return (node) => ts.visitNode(node, visit);
    }]);
    const printed = ts.createPrinter().printFile(result.transformed[0]);
    const relative = file === 'app/page.tsx' ? './components/WebsiteLocale' : './WebsiteLocale';
    fs.writeFileSync(file, printed.replace('"use client";', `"use client";\nimport { useWebsiteLocale } from ${JSON.stringify(relative)};`));
    result.dispose();
  }
}
// Include the display-valued data and SEO copy, not IDs, CSS tokens, URLs or paths.
for (const file of ['app/site-data.ts', 'app/layout.tsx', 'app/homepage-locale.ts', ...files]) {
 const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
 const visit = (node) => {
  if (ts.isStringLiteral(node)) {
   const parent = node.parent;
   if (ts.isPropertyAssignment(parent) && ['title','eyebrow','description','question','answer','due','label','alt','friction','price','annualPrice','default'].includes(parent.name.getText(source))) add(node.text);
   if (ts.isArrayLiteralExpression(parent) && ts.isPropertyAssignment(parent.parent) && ['features','featureList'].includes(parent.parent.name.getText(source))) add(node.text);
   let ancestor = parent;
   while (ancestor && !ts.isStatement(ancestor)) {
    if (ts.isCallExpression(ancestor) && ancestor.expression.getText(source) === 't') { add(node.text); break; }
    ancestor = ancestor.parent;
   }
  }
  ts.forEachChild(node, visit);
 };
 visit(source);
}
['Language','Available languages','English version','Screens {first} of {total}','Screens {first}–{last} of {total}','{platform} blocker example','English screenshot','Translated app screenshot','animated brand story', 'Nonlate | More connected. Less distracted.', 'Nonlate deadline blockers on iOS and Android', 'Free download with optional Plus and Pro subscriptions', 'School','Calendars','Tasks','Work & projects','Calendar feeds'].forEach(add);
const output = {strings:[...sources].sort()};
if (process.argv.includes('--check')) {
  const previous = JSON.parse(fs.readFileSync('translations/homepage/source.json', 'utf8'));
  if (JSON.stringify(previous.strings) !== JSON.stringify(output.strings)) {
    const missing = output.strings.filter((text) => !previous.strings.includes(text));
    const removed = previous.strings.filter((text) => !output.strings.includes(text));
    throw new Error(`Homepage copy changed; reconcile all dictionaries and indexed reviews before export. Added: ${JSON.stringify(missing)}; removed: ${JSON.stringify(removed)}`);
  }
} else {
  fs.mkdirSync('translations/homepage', {recursive:true});
  fs.writeFileSync('translations/homepage/source.json', JSON.stringify(output, null, 2)+'\n');
}
console.log(`${sources.size} homepage translation units`);
