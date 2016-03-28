var DeclarationBundlerPlugin = (function () {
    function DeclarationBundlerPlugin(options) {
        if (options === void 0) { options = {}; }
        this.out = options.out ? options.out : './build/';
        this.excludedReferences = options.excludedReferences ? options.excludedReferences : undefined;
    }
    DeclarationBundlerPlugin.prototype.apply = function (compiler) {
        var _this = this;
        //when the compiler is ready to emit files
        compiler.plugin('emit', function (compilation, callback) {
            //collect all generated declaration files
            //and remove them from the assets that will be emited
            var declarationFiles = {};
            for (var filename in compilation.assets) {
                if (filename.indexOf('.d.ts') !== -1) {
                    declarationFiles[filename] = compilation.assets[filename];
                    delete compilation.assets[filename];
                }
            }
            //combine them into one declaration file
            var combinedDeclaration = _this.generateCombinedDeclaration(declarationFiles);
            //and insert that back into the assets
            compilation.assets[_this.out] = {
                source: function () {
                    return combinedDeclaration;
                },
                size: function () {
                    return combinedDeclaration.length;
                }
            };
            //webpack may continue now
            callback();
        });
    };
    DeclarationBundlerPlugin.prototype.generateCombinedDeclaration = function (declarationFiles) {
        var declarations = '';
        for (var fileName in declarationFiles) {
            var declarationFile = declarationFiles[fileName];
            var data = declarationFile.source();
            var lines = data.split("\n");
            var i = lines.length;
            while (i--) {
                var line = lines[i];
                //exclude empty lines
                var excludeLine = line == "";
                //exclude export statements
                excludeLine = excludeLine || line.indexOf("export") !== -1;
                //exclude import statements
                excludeLine = excludeLine || line.indexOf("import") !== -1;
                //if defined, check for excluded references
                if (!excludeLine && this.excludedReferences && line.indexOf("<reference") !== -1) {
                    excludeLine = this.excludedReferences.some(function (reference) { return line.indexOf(reference) !== -1; });
                }
                if (excludeLine) {
                    lines.splice(i, 1);
                }
            }
            declarations += lines.join("\n") + "\n\n";
        }
        return declarations;
    };
    return DeclarationBundlerPlugin;
})();
module.exports = DeclarationBundlerPlugin;
