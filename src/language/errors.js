export class VBError extends Error {
  constructor(message, number = 5, source = null, line = 0, column = 0) { super(message); this.name = 'VBError'; this.number = number; this.source = source; this.line = line; this.column = column; }
}
