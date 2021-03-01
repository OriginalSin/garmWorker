import babel from 'rollup-plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import css from 'rollup-plugin-css-porter';
// import globals from 'rollup-plugin-node-globals';
// import builtins from 'rollup-plugin-node-builtins';
// import cpy from 'rollup-plugin-cpy';

const extensions = [
  '.js', '.jsx', '.ts', '.tsx', '.css'
];

export default [
    {
        input: 'src/index.js',        
        output: { 
            file: 'public/main.js',
            format: 'iife',
            sourcemap: true,
            name: 'Test',
            globals: {
                'leaflet': 'L'
            },
        },
        plugins: [                      
            resolve({
				preferBuiltins: false
                // customResolveOptions: {
                    // moduleDirectory: ['node_modules', 'src']
                // },
            }),
            commonjs(),            
            css({dest: 'public/main.css', minified: false}),
            // cpy([
                // {files: 'src/images/*.*', dest: 'public/assets/images'},
                // {files: 'src/ImageBitmapLoader-worker.js', dest: 'public'},
            // ]),
            babel({                
                extensions: ['.js', '.mjs'],
                exclude: ['node_modules/@babel/**', 'node_modules/core-js/**'],
                include: ['example/**', 'src/**']
            }),
        ],
    },    
    {
        input: 'src/worker/dataManager.js',
        output: [            
            {
                file: 'public/dataManager.js',
                format: 'iife',
                name: 'DataManager',
                sourcemap: true,
				globals: {
					'leaflet': 'L',
					'pixi.js': 'url'
				},
            }
        ],
        external: [],
        plugins: [    
			// globals(),
			// builtins(),
            resolve({
				preferBuiltins: false
			}),
            commonjs(),            
            babel({
                // extensions,
                // babelHelpers: 'bundled',
                exclude: ['node_modules/@pixi/polyfill/**'],
                include: ['src/**/*'],
            }),
        ],    
    },
   
];