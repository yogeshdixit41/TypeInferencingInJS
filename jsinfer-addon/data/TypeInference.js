//var Reflect = require('reflect');
//var generatedSource = new XMLSerializer().serializeToString(document);

//var jsScriptPattern = /<script type = "text\/javascript"\s*>(.|\s)*<\/script>/gi;
// variable matches contains list of the source codes
//var matches = generatedSource.match(jsScriptPattern);
//console.log("Hello" + matches + "--" +typeof generatedSource );


var typeMapArray = [];
var errorFlag = false;


//var code = "var y;var myInt = [10, 11]; var myString ='hello';function test(y){var x = 12; return x;}";
var code = "var num = 12; var str = \'hello\'; var y = num - str;";
//var code = "var num = 12; var y = num + 10;";
//var code = "var x = 3; var y = \"hi there\"; y = 12 + x;"
//var code = "var x = 3 + \"hello\" ; var y = \'ghi\' - 2; x = 3 + 4; x = 3;";

try {
    eval(code);
} catch (e) {
    if (e instanceof SyntaxError) {
        console.log("Syntax error");
        endScript();
    }
}

var ast = Reflect.parse(code, {loc:true,range:true,raw:true,tokens:true,comment:true});
//console.log(ast);
mainParse(ast);
if(!errorFlag)
  console.log("No errors found in the given JS program.... you are type safe now ");
console.log(typeMapArray);

//console.log(ast);

function mainParse(ast)
{
  for(a in ast.body)
  {
      if(!errorFlag)
      {
          statementTypeDetector(ast.body[a]);
      }
      else
      {
        console.log("Type inference interrupted ... error found");
        break;
      }
  }

}

/**
* Helper function to parse function object
* this function calls evaluateFunctionExpression which evaluates the typeMap
**/

function parseFunctionExpression(idObj, bodyObj, rangeObj, locationObj)
{
  //console.log(bodyObj);
  inferredType = evaluateFunctionExpression(bodyObj);
  var typeMap = {};
  typeMap.rangeObj = rangeObj;
  typeMap.inferredType = inferredType;
  typeMap.name = idObj.name;
  typeMapArray.push(typeMap);
  console.log("Inferred type for "+ idObj.name +" is "+ inferredType);
}


/**
* Parse assignment expressionObj
* Call parseBinaryExpression if expression type is binary or
* call geType if it is a Literal
**/

function parseExpression(expressionObj)
{

  if(expressionObj['type'] === "AssignmentExpression" && expressionObj['operator'] === '=')
  {

    if(expressionObj['right'].type === 'BinaryExpression')
    {
      inferredTypeRightObj = evaluateBinaryExpression(expressionObj['right']);
      lookupTypeLeftObj = lookupType(expressionObj['left']);
      if(inferredTypeRightObj !== lookupTypeLeftObj)
      {
        console.log("Cannot assign "+ inferredTypeRightObj + " to " + lookupTypeLeftObj);
        typeError(expressionObj['left']);
      }
      //parseBinaryExpression(expressionObj['left'], expressionObj['right'], expressionObj['range'], expressionObj['loc']);
    }
    else if (expressionObj['right'].type === 'Literal')
    {
      inferredTypeRightObj = getType(expressionObj['right']);
      lookupTypeLeftObj = lookupType(expressionObj['left']);
      if(inferredTypeRightObj !== lookupTypeLeftObj)
      {
        console.log("Cannot assign "+ inferredTypeRightObj + " to " + lookupTypeLeftObj);
        typeError(expressionObj['left']);
      }
    }
  }
}


/**
* Parse binary expressionObj
* Calls evaluateBinaryExpression
**/

function parseBinaryExpression(leftObj, rightObj, rangeObj, locationObj)
{
  //for(e in rightObj)
    //console.log(e + "----" + rightObj[e]);
  inferredType = evaluateBinaryExpression(rightObj);
  if(inferredType === "Type check error")
  {
      console.log("Type error...");
      typeError(leftObj);
  }
  else
  {
    var typeMap = {};
    typeMap.rangeObj = rangeObj;
    typeMap.inferredType = inferredType;
    typeMap.name = leftObj.name;
    typeMapArray.push(typeMap);
    console.log("Inferred type for "+ leftObj.name +" is "+ inferredType);
  }
}


/**
* Helper function to parse araay expressionObj
* Calls evaluateArrayExpression to infer types
**/

function parseArrayExpression(leftObj, rightObj, rangeObj, locationObj)
{
  var typeMap = {};
  inferredType = '['+evaluateArrayExpression(rightObj)+']';
  typeMap.rangeObj = rangeObj;
  typeMap.inferredType = inferredType;
  typeMap.name = leftObj.name;
  typeMapArray.push(typeMap);
  console.log("Inferred type for "+ leftObj.name +" is "+ inferredType);
}

/**
* Inferrs the type of an array the type of te array
**/
function evaluateArrayExpression(arrayExpression)
{
  var dafaultType = "DefaultArrayType";
  var initialType = "";
  var type = "";
  if(arrayExpression.elements.length === 0 || arrayExpression.elements.length === null)
  {
    return dafaultType;
  }
  else
  {
    if(arrayExpression.elements.length === 1)
    {
      return getType(arrayExpression.elements[0]);
    }
    initialType = getType(arrayExpression.elements[0]);
    for(element in arrayExpression.elements)
    {
      type = getType(arrayExpression.elements[element]);
      if(type!== initialType)
        return dafaultType;
    }
    return type;
  }

}

/**
* eInferrs the type of an function of which funBodyObject is passed as parameter
**/

function evaluateFunctionExpression(funBodyObject)
{
  for(i in funBodyObject.body)
  {
    statementTypeDetector(funBodyObject.body[i]);
    if(funBodyObject.body[i].type === "ReturnStatement")
    {
      returnStatementArguement = funBodyObject.body[i].argument;
      if(returnStatementArguement.type === "Identifier")
      {
        for(t in typeMapArray)
        {
          if(typeMapArray[t].name === returnStatementArguement.name && typeMapArray[t].rangeObj[0] > funBodyObject.range[0] && typeMapArray[t].rangeObj[0] < funBodyObject.range[1])
          {
            return typeMapArray[t].inferredType;
          }

        }
      }

    }
    //console.log(funBodyObject.body[i]);
  }
}

/*
** Evaluate binary expression pass as parameter
** inferr type based on different cases
** returns type check error
*/
function evaluateBinaryExpression(binExpressionObj)
{
  //console.log(binExpressionObj.left.range);
  typeLeft = getType(binExpressionObj.left);
  typeRight = getType(binExpressionObj.right);
  operator = binExpressionObj.operator;
  //console.log(typeLeft + "-" + typeRight + "-" + operator);
  if(operator === "-" && (typeLeft !== "Numeric" || typeRight !== "Numeric"))
  {
    return "Type check error";
  }
  else if(operator === "*" && (typeLeft !== "Numeric" || typeRight !== "Numeric"))
  {
    return "Type check error";
  }
  else if(operator === "/" && (typeLeft !== "Numeric" || typeRight !== "Numeric"))
  {
    return "Type check error";
  }
  else if(operator === "+" && typeLeft === "Numeric" && typeRight === "Numeric")
  {
    return "Numeric";
  }
  else if(operator === "+" && typeLeft === "String" && typeRight === "Numeric")
  {
    return "String";
  }
  else if(operator === "+" && typeLeft === "Numeric" && typeRight === "String")
  {
    return "String";
  }
  else if(operator === "+" && typeLeft === "String" && typeRight === "String")
  {
    return "String";
  }
  else
  {
    return "Type check error";
  }
}


/**
* returns the type of the obj passed as parameter
**/
function getType(obj)
{

  for(t in ast.tokens)
  {
    //console.log(ast.tokens[t].range + "----" + obj.range);
    if(ast.tokens[t].range === obj.range)
    {
      //console.log("##"+ast.tokens[t].type);
      var type = ast.tokens[t].type;
      if( type === 'Identifier')
      {
        type = lookupType(obj);
      }
      return type;

    }
    else
    {
      //return lookupType(obj);
    }
  }
}


function lookupType(obj)
{
  //console.log("Inside lookup ---- " + obj.range + "----" + obj.name);
  for ( each in typeMapArray)
  {
    if(typeMapArray[each].name === obj.name)
    {
      return typeMapArray[each].inferredType;
    }
  }
}

function typeError(obj)
{
  errorFlag = true;
  console.log(" ***** Type error at line "+ obj.loc.start.line + " and column "+ obj.loc.start.column + " ***** ");
}


function statementTypeDetector(statementObj)
{
  if(statementObj.type === "ExpressionStatement" )
  {
    //console.log(statementObj);
    parseExpression(statementObj.expression);
  }
  else if(statementObj.type === "VariableDeclaration")
  {
    if(statementObj.declarations[0].init != null)
    {
      if(statementObj.declarations[0].init.type === "BinaryExpression")
      {
        //console.log("Var decl found");
        parseBinaryExpression(statementObj.declarations[0].id, statementObj.declarations[0].init, statementObj.declarations[0].range, statementObj.declarations[0].loc);
      }
      else if(statementObj.declarations[0].init.type === "ArrayExpression")
      {
        parseArrayExpression(statementObj.declarations[0].id, statementObj.declarations[0].init, statementObj.declarations[0].range, statementObj.declarations[0].loc);
      }
      else
      {
        //console.log(statementObj);
        var typeMap = {};
        var rangeObj = statementObj.declarations[0].range;
        var inferredType = getType(statementObj.declarations[0].init);
        typeMap.rangeObj = rangeObj;
        typeMap.inferredType = inferredType;
        typeMap.name = statementObj.declarations[0].id.name;
        typeMapArray.push(typeMap);
        console.log("Inferred type for "+ statementObj.declarations[0].id.name +" is "+ inferredType);
      }
    }

  }
  else if(statementObj.type === "FunctionDeclaration")
  {
    //console.log(ast.body[a]);
    parseFunctionExpression(statementObj.id, statementObj.body, statementObj.range, statementObj.loc);
  }
}

function endScript()
{
  return;
}
