// Generated automatically by nearley, version 2.15.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

const moo = require("moo");
const lexer = moo.compile({
  ws: /[ \t]+/,
  word: {match: /[^\{\{\}\}\|\s=]+/, lineBreaks: true},
  open: /\{\{/,
  close:/\}\}/,
  delim: /\|/,
  eq: /=/
});
var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "main$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "main$ebnf$1$subexpression$1$ebnf$1", "symbols": ["main$ebnf$1$subexpression$1$ebnf$1", "word"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "main$ebnf$1$subexpression$1", "symbols": ["template", "main$ebnf$1$subexpression$1$ebnf$1"]},
    {"name": "main$ebnf$1", "symbols": ["main$ebnf$1$subexpression$1"]},
    {"name": "main$ebnf$1$subexpression$2$ebnf$1", "symbols": []},
    {"name": "main$ebnf$1$subexpression$2$ebnf$1", "symbols": ["main$ebnf$1$subexpression$2$ebnf$1", "word"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "main$ebnf$1$subexpression$2", "symbols": ["template", "main$ebnf$1$subexpression$2$ebnf$1"]},
    {"name": "main$ebnf$1", "symbols": ["main$ebnf$1", "main$ebnf$1$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "main", "symbols": ["main$ebnf$1"]},
    {"name": "template$ebnf$1", "symbols": []},
    {"name": "template$ebnf$1", "symbols": ["template$ebnf$1", "ws"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "template$ebnf$2", "symbols": []},
    {"name": "template$ebnf$2", "symbols": ["template$ebnf$2", (lexer.has("word") ? {type: "word"} : word)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "template$ebnf$3$subexpression$1$ebnf$1", "symbols": []},
    {"name": "template$ebnf$3$subexpression$1$ebnf$1", "symbols": ["template$ebnf$3$subexpression$1$ebnf$1", "ws"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "template$ebnf$3$subexpression$1", "symbols": [(lexer.has("delim") ? {type: "delim"} : delim), "template$ebnf$3$subexpression$1$ebnf$1", "templateValue"]},
    {"name": "template$ebnf$3", "symbols": ["template$ebnf$3$subexpression$1"]},
    {"name": "template$ebnf$3$subexpression$2$ebnf$1", "symbols": []},
    {"name": "template$ebnf$3$subexpression$2$ebnf$1", "symbols": ["template$ebnf$3$subexpression$2$ebnf$1", "ws"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "template$ebnf$3$subexpression$2", "symbols": [(lexer.has("delim") ? {type: "delim"} : delim), "template$ebnf$3$subexpression$2$ebnf$1", "templateValue"]},
    {"name": "template$ebnf$3", "symbols": ["template$ebnf$3", "template$ebnf$3$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "template$ebnf$4", "symbols": []},
    {"name": "template$ebnf$4", "symbols": ["template$ebnf$4", "ws"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "template", "symbols": [(lexer.has("open") ? {type: "open"} : open), "template$ebnf$1", "templateName", "template$ebnf$2", "template$ebnf$3", "template$ebnf$4", (lexer.has("close") ? {type: "close"} : close)]},
    {"name": "templateName", "symbols": ["word"]},
    {"name": "templateValue$ebnf$1$subexpression$1", "symbols": ["ws", "word"]},
    {"name": "templateValue$ebnf$1", "symbols": ["templateValue$ebnf$1$subexpression$1"]},
    {"name": "templateValue$ebnf$1$subexpression$2", "symbols": ["ws", "word"]},
    {"name": "templateValue$ebnf$1", "symbols": ["templateValue$ebnf$1", "templateValue$ebnf$1$subexpression$2"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "templateValue", "symbols": ["word", "ws", (lexer.has("eq") ? {type: "eq"} : eq), "templateValue$ebnf$1"]},
    {"name": "word", "symbols": [(lexer.has("word") ? {type: "word"} : word)]},
    {"name": "ws", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": function(d) {return null;}}
]
  , ParserStart: "main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
