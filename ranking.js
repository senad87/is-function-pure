const { ESLint } = require("eslint");

async function getCognitiveComplexity(code) {
  const eslint = new ESLint({
    useEslintrc: false,
    overrideConfig: {
      env: {
        node: true,
        es6: true,
      },
      plugins: ["sonarjs"],
      rules: {
        "sonarjs/cognitive-complexity": ["error", 0],
      },
    },
  });

  try {
    const results = await eslint.lintText("var test = " + code);
    const hasMessages = results[0].messages.length > 0;

    if (hasMessages) {
      const hasSyntaxError = results[0].messages[0].ruleId === null;
      if (!hasSyntaxError) {
        return getFirstNumber(results[0].messages[0].message);
      }
    } else {
      //since when there are no error messages in results means congnitive complexity is at 0 zero
      return 0;
    }
  } catch (e) {
    console.error(e);
  }
}

// i("Refactor this function to reduce its Cognitive Complexity from 10 to the 0 allowed.").o("10");

function getFirstNumber(e) {
  return parseInt(e.match(/\d+/g)[0], 10);
}

// (async function () {
//   const rank = await getRanking(`function quot_end(content, dot) {
//     for (let i = dot + 1; i < content.length; ++i) {
//         if (content[dot] == content[i])
//             return i;
//     }

//     return -1;
// }`);
//   console.log(rank);
// })();

module.exports = {
  getCognitiveComplexity,
};
