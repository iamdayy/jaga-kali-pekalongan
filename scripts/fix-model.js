const fs = require('fs');
const path = require('path');

const modelPath = path.join(process.cwd(), 'public/model/model.json');

try {
    const rawData = fs.readFileSync(modelPath, 'utf8');
    const model = JSON.parse(rawData);

    let fixedCount = 0;

    if (model.modelTopology && model.modelTopology.model_config && model.modelTopology.model_config.config && model.modelTopology.model_config.config.layers) {
        const layers = model.modelTopology.model_config.config.layers;

        layers.forEach(layer => {
            if (layer.inbound_nodes && Array.isArray(layer.inbound_nodes)) {
                const newInboundNodes = [];
                let needsFix = false;

                layer.inbound_nodes.forEach(node => {
                    // Check if it's the Keras 3 object format
                    if (node.args && node.kwargs !== undefined) {
                        needsFix = true;
                        const callArgs = [];
                        
                        // Process args (inputs)
                        node.args.forEach(arg => {
                             if (arg.config && arg.config.keras_history) {
                                 // [layerName, nodeIndex, tensorIndex]
                                 const history = arg.config.keras_history;
                                 
                                 // Construct valid TF.js node ref: [name, nodeIdx, tensorIdx, kwargs]
                                 // Note: TF.js usually expects kwargs as the 4th element if present
                                 const nodeRef = [...history];
                                 
                                 // Simplify kwargs: keep only if useful, or just empty object
                                 // The error said "expected array", so we need to be careful.
                                 // Usually: [name, 0, 0, {}]
                                 nodeRef.push(node.kwargs || {});
                                 
                                 callArgs.push(nodeRef);
                             }
                        });
                        
                        // inbound_nodes is an array of "call args"
                        // Each call args is an array of inputs
                        // BUT, strict Keras 2 format for single input is just [[name, 0, 0, {}]]
                        // For multiple inputs: [[name1,0,0], [name2,0,0]]? 
                        
                        // Based on standard Keras 2 export:
                        // inbound_nodes: [
                        //    [
                        //      ["layer_name", 0, 0, {kwargs}]
                        //    ]
                        // ]
                        
                        // However, if there are multiple inputs (like Add or Concatenate), it might be flattened or nested differently.
                        // Let's assume standard [ [ref1], [ref2] ] is NOT correct for single call with multiple inputs.
                        // It should be [ [ref1, ref2] ] for one call with 2 inputs.
                        
                        if (callArgs.length > 0) {
                            newInboundNodes.push(callArgs);
                        }
                    } else {
                        // Already in old format or different structure
                        newInboundNodes.push(node);
                    }
                });

                if (needsFix) {
                    layer.inbound_nodes = newInboundNodes;
                    fixedCount++;
                }
            }
        });
    }

    if (fixedCount > 0) {
        fs.writeFileSync(modelPath, JSON.stringify(model, null, 4));
        console.log(`Successfully fixed ${fixedCount} layers in model.json`);
    } else {
        console.log("No layers needed fixing or file structure unrecognized.");
    }

} catch (error) {
    console.error("Error fixing model:", error);
}
