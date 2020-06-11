

const isNumber = (str) => {
    try { 
      if (!isNaN(parseFloat(str))){
      
      return true
      } else {
          return false
      }
    } catch (err) {
      return false
    }
  }

const peek = (arr) => {
    if (arr.length>0){
    return arr[arr.length-1]
    } 
    return null
  }

const  precedence = (op1, op2) => {

    const precedences = {'+': 0, '-': 0, '/': 1, '*': 1, '%': 1, '\u221A': 2, '\u00B2':2}
    return precedences[op1]>precedences[op2]
  }

const  applyOperator = (operators, values, rootPriority) => {
    console.log(values)
    console.log(operators)
    let operator = operators.pop()
    if (operator==='\u221A') {
      const priority = peek(rootPriority)
      rootPriority.pop()
      console.log(priority)
      if (priority===1) {
        let right = values.pop()
        let left= values.pop()
        values.push(left*Math.sqrt(right))
      } else {
        let right=values.pop()
        values.push(Math.sqrt(right))
      }
    } 
    else if (operator==='\u00B2'){
      let  left = values.pop()
      values.push(left*left)
    } 
    else {
    let right = values.pop()
    let left= values.pop()
    if (operator==='+') {
      values.push(right+left)
    } else if (operator==='-') {
      values.push(left-right)
    } else if (operator==='*') {
      values.push(left*right)
    } else if (operator==='/') {
      values.push(left/right)
    } else if (operator==='%') {
      console.log({'a':left=='-1', 'b': peek(operators)==='*','c':operators[operators.length-2]==='+'})
      if (peek(operators)==='+'){
        operators.pop()
        values.push(left*(1+right/100))
      } else if (left=='-1'&& peek(operators)==='*' && operators[operators.length-2]==='+') {
        operators.pop()
        operators.pop()
        left = values.pop()
        values.push(left*(1-right/100))
      }
        else {
            values.push(left)
            values.push(right/100)
        }
         
    } 
  }
  console.log(values)
  console.log(operators)
  }

const evaluate = (expression) => {  
  if (expression.length>0) {
    const re = /[+/*()-]|[0-9]*\.?[0-9]+|\u221A|\u00B2|%/g
    let tokens = expression.match(re)
    console.log(tokens)
    if (tokens[0]==='-') {
        tokens = tokens.slice(1,tokens.length)
        tokens[0]='-'+tokens[0]
    }
    console.log(tokens)
    if (tokens[tokens.length-1].match(/\+|\*|\/|-|\u221A|\.$/)){
        tokens=tokens.slice(0,-1)
    }
    console.log(tokens)
    const operators=[]
    const values = []
    const rootPriority=[]
    let j = 0
    while (j<tokens.length){
      if (tokens[j]==='-') {
        tokens[j]='+'
        tokens=[...tokens.slice(0,j+1),...['-1','*'],...tokens.slice(j+1,tokens.length)]
        
      }
      j=j+1
    }
    console.log(tokens)
    tokens.forEach((token,i) => {
        console.log(token)
        if (tokens[i+1]==='%' && tokens[i+2] && (tokens[i+2]==='*'||tokens[i+2]==='/'||tokens[i+2]==='\u221A')){
            tokens.splice(i+1,1)
            token=String(parseFloat(token)/100)
        }
        if (token==='\u221A'){
          if (tokens[i-1] && tokens[i-1].match(/[0-9]/)) {
            rootPriority.push(1)
          } else {
            rootPriority.push(0)
          }
        }

        if (isNumber(token)) {
            values.push(parseFloat(token))
        } else if (token==='(') {
            if (tokens[i+1]==='-'){
                tokens.splice(i+1,1)
                tokens[i+1]='-'+tokens[i+1]
            }
            operators.push(token)
        } else if (token === ')') {
            top = peek(operators)
            while (top && top!=='(') {
                applyOperator(operators,values, rootPriority)
                top= peek(operators)
            }
            operators.pop()
        } else {
            top = peek(operators)
            try {
            while (top && top!=='(' && top!==')' && precedence(top,token)){
                console.log('hello'+operators)
                console.log('hello'+values)
                applyOperator(operators,values, rootPriority)
                top = peek(operators)
            } } catch {
                null
            }
            operators.push(token)
            
        }
    });
    while (peek(operators)) {
        applyOperator(operators, values, rootPriority)
    }
    if (operators.length>0) {
      return undefined
    }
    return values[0]
  }
}

export default evaluate;