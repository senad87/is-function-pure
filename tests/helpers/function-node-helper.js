

// creates empty escope function ast node to be used in tests
// https://github.com/estools/escope
function createEmptyNode() {
    return {
        references: [],
        variables: [],
        block: {
            body: {
                body: []
            }
        }
    };
}

module.exports = {
    createEmptyNode: createEmptyNode
};