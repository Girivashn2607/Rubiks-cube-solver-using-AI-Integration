import fs from 'fs';

let c1 = fs.readFileSync('node_modules/cubejs/lib/cube.js', 'utf8');
let c2 = fs.readFileSync('node_modules/cubejs/lib/solve.js', 'utf8');

c1 = c1.replace(/\.call\(this\);/g, '.call(globalThis);');
c1 = c1.replace(/this\.Cube = Cube;/g, 'globalThis.Cube = Cube;');
c1 = c1.replace(/module\.exports = Cube;/g, 'globalThis.Cube = Cube;');

c2 = c2.replace(/\.call\(this\);/g, '.call(globalThis);');
c2 = c2.replace(/Cube = this\.Cube \|\| require\('\.\/cube'\);/g, 'Cube = globalThis.Cube;');
c2 = c2.replace(/module\.exports = Cube;/g, 'globalThis.Cube = Cube;');

const code = `// Kociemba Two-Phase Solver engine modern ES wrapper
const root = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this || {};

${c1}

${c2}

export const Cube = globalThis.Cube;
export default globalThis.Cube;
`;

fs.writeFileSync('src/solver/kociembaLib.js', code, 'utf8');
console.log('Successfully built src/solver/kociembaLib.js');
