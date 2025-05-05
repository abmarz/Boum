export class Program {
  constructor(statements) {
    Object.assign(this, { statements });
  }
}

export class PrintStmt {
  constructor(argument) {
    Object.assign(this, { argument });
  }
}

export class AssignStmt {
  constructor(target, source) {
    Object.assign(this, { target, source });
  }
}

export class VarDec {
  constructor(variable, initializer) {
    Object.assign(this, { variable, initializer });
  }
}

export class Variable {
  constructor(name, type) {
    Object.assign(this, { name, type });
  }
}

export class WhileStmt {
  constructor(test, body) {
    Object.assign(this, { test, body });
  }
}

export class FunDec {
  constructor(fun, body) {
    Object.assign(this, { fun, body });
  }
}

export class Fun {
  constructor(name, params, returnType) {
    Object.assign(this, { name, params, returnType });
  }
}

export class ReturnStmt {
  constructor(expression) {
    Object.assign(this, { expression });
  }
}

// we might be missing something for the block here

export class ArrayType {
  constructor(baseType) {
    Object.assign(this, { baseType });
  }
}

export class BasicType {
  constructor(name) {
    Object.assign(this, { name });
  }
}

export class BinaryExp {
  constructor(op, left, right, type) {
    Object.assign(this, { op, left, right, type });
  }
}

export class UnaryExp {
  constructor(op, operand, type) {
    Object.assign(this, { op, operand, type });
  }
}

export class ArrayExp {
  constructor(elements) {
    Object.assign(this, { elements });
  }
}

export class SubscriptExp {
  constructor(array, subscript) {
    Object.assign(this, { array, subscript });
  }
}

export class Call {
  constructor(fun, args) {
    Object.assign(this, { fun, args });
  }
}
