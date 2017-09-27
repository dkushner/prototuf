# prototuf
Protobuf parser, linter and analysis toolset.

### Structure

Processing of a protobuf project occurs in multiple stages. The primitives 
of lexing, parsing and analysis are the `SourceFile` which represents an
individual text file of Protobuf source and the `Project` which represents
a collection of `SourceFile`s included in one compilation unit.

#### Lexing
Lexing, or tokenization, is carried out by a the `Lexer` class instance. The
lexer takes raw Protobuf source text and produces a series of tokens scanning. 

#### Parser
Parsing is carried out by a `Parser` class instance. The parser takes corpus of
raw Protobuf source and uses the lexer to reduce it to a sequence of tokens.
It then attempts to interpret this sequence of tokens as a valid Protobuf
expression. It enforces only the syntactic constraints of the Protobuf language
and will not check for things like valid type references or reference
reachability. It produces an abstract syntax tree representation of the
provided source.

#### Binder
Binding is carried out by the `Binder` class instance. The binding step
validates the correctness of an AST. It is provided a `Project`. It then parses
and scans each file in the provided project, building an associated symbol
table noting the location and attributes of each defined symbol. A final pass
validates the correctness of all type references included in the project. 
