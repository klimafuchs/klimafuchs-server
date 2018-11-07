@{%
const moo = require("moo");
const lexer = moo.compile({
  ws: /[ \t]+/,
  word: {match: /[^\{\{\}\}\|\s=]+/, lineBreaks: true},
  open: /\{\{/,
  close:/\}\}/,
  delim: /\|/,
  eq: /=/
});
%}
@lexer lexer
main -> (template word:*):+
template -> %open ws:* templateName %word:* ( %delim  ws:* templateValue):+ ws:* %close
templateName -> word {%
                         function(d) {
                             return {
                             templateName: d[0]
                             };
                         }
                     %}
templateValue -> word ws %eq (ws word):+
word -> %word
ws -> %ws {% function(d) {return null;} %}