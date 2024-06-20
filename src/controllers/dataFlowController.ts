import { Request, Response, NextFunction } from 'express';
const bodyParser = require('body-parser');
const pdfParse = require('pdf-parse');
import "dotenv/config";
import { put } from '@vercel/blob';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

interface intentData {
    type: string;
    node_data: any;
}

export const insertNode = async (req: Request, res: Response, next: Function) => {
   //console.log("insertNode",req.body);
   try {

    await prisma.node.create({
        data: {
            node_id: req.body.id,
            dragging: req.body.dragging,
            height: req.body.height,
            position: req.body.position,
            position_absolute: req.body.positionAbsolute,
            selected: req.body.selected,
            type: req.body.type,
            width: req.body.width,
            extent: req.body.extent,
            parent_id: req.body.parentId,
            language: req.body.language,
        },
      });
    res.json({ status: "success"}) 
    } catch (error) {
    console.error('Error inserting data:', error);
    }
  };
  

export const insertEdge = async (req: Request, res: Response, next: Function) => {
    //console.log("insertEdge",req.body);
    try {
        await prisma.edge.create({
            data: {
                edge_id: req.body.id,
                source: req.body.source,
                source_handle: req.body.sourceHandle,
                target: req.body.target,
                target_handle: req.body.targetHandle,
                type: req.body.type
            },
          });
        res.json({ status: "success"}) 
        } catch (error) {
        console.error('Error inserting data:', error);
    }
};

export const updateNode = async (req: Request, res: Response, next: Function) => {
    //console.log("updateNode",req.body);
    try {
    await prisma.node.updateMany({
        where: {  node_id: req.body.id },
        data: {  position: req.body.position },
    });
     res.json({ status: "success"}) 
     } catch (error) {
     console.error('Error inserting data:', error);
     }
};
  
export const updateEdge = async (req: Request, res: Response, next: Function) => {
    //console.log("updateEdge",req.body);
    try {
    await prisma.edge.updateMany({
        where: {  edge_id: req.body.id },
        data: {  
            source: req.body.source,
            source_handle: req.body.sourceHandle,
            target: req.body.target,
            target_handle: req.body.targetHandle,
            type: req.body.type  
        },
    });
     res.json({ status: "success"}) 
     } catch (error) {
     console.error('Error inserting data:', error);
     }
};

export const deleteNode = async (req: Request, res: Response, next: Function) => {
    //console.log("deleteNode",req.body);
    try {
    if(req.body.type == "start"){
        await prisma.node.deleteMany({where: {node_id: req.body.id }});
        await prisma.edge.deleteMany({where: {source: req.body.id }});
        await prisma.edge.deleteMany({where: {target: req.body.id }});
    
    }
    if(req.body.type == "end"){

        await prisma.node.deleteMany({where: {node_id: req.body.id }});
        await prisma.edge.deleteMany({where: {source: req.body.id }});
        await prisma.edge.deleteMany({where: {target: req.body.id }});

    }
    if(req.body.type == "textOnly"){
        await prisma.node.deleteMany({where: {node_id: req.body.id }});
        await prisma.edge.deleteMany({where: {source: req.body.id }});
        await prisma.edge.deleteMany({where: {target: req.body.id }});
        await prisma.flowTextOnly.deleteMany({where: {node_id: req.body.id }});

    }
    if(req.body.type == "textinput"){
        await prisma.node.deleteMany({where: {node_id: req.body.id }});
        await prisma.edge.deleteMany({where: {source: req.body.id }});
        await prisma.edge.deleteMany({where: {target: req.body.id }});
        await prisma.flowTextBox.deleteMany({where: {node_id: req.body.id }});
    }
    if(req.body.type == "button"){
        await prisma.node.deleteMany({where: {node_id: req.body.id }});
        await prisma.edge.deleteMany({where: {source: req.body.id }});
        await prisma.edge.deleteMany({where: {target: req.body.id }});
        await prisma.flowButtonData.deleteMany({where: {node_id: req.body.id }});
        
    }
    if(req.body.type == "cardGroup"){
        await prisma.node.deleteMany({where: {node_id: req.body.id }});
        const childs = await prisma.node.findMany({where: {parent_id : req.body.id}});
        for (var c = 0; c < childs.length; c++){
            if(childs[c].type == 'cardHeader'){
                await prisma.flowCardData.deleteMany({where: {node_id:  childs[c].node_id }});
            }
            else{
                await prisma.flowButtonData.deleteMany({where: {node_id:  childs[c].node_id }});
            }
        }
        await prisma.node.deleteMany({where: {parent_id: req.body.id }});
        await prisma.edge.deleteMany({where: {source: req.body.id }});
        await prisma.edge.deleteMany({where: {target: req.body.id }});
        
    }
    if(req.body.type == "buttonGroup"){
        await prisma.node.deleteMany({where: {node_id: req.body.id }});

        const child_buttons = await prisma.node.findMany({where: {parent_id : req.body.id}});
        for (var c = 0; c < child_buttons.length; c++){
            await prisma.flowButtonData.deleteMany({where: {node_id:  child_buttons[c].node_id }});
        }
        await prisma.node.deleteMany({where: {parent_id: req.body.id }});
        await prisma.edge.deleteMany({where: {source: req.body.id }});
        await prisma.edge.deleteMany({where: {target: req.body.id }});
        
    }

    if(req.body.type == "cardStyleOne"){
        await prisma.node.deleteMany({where: {node_id: req.body.id }});
        await prisma.node.deleteMany({where: {parent_id: req.body.id }});
        await prisma.edge.deleteMany({where: {source: req.body.id }});
        await prisma.edge.deleteMany({where: {target: req.body.id }});
        await prisma.flowCardData.deleteMany({where: {node_id: req.body.id }});

    }
    if(req.body.type == "formGroup"){
        await prisma.node.deleteMany({where: {parent_id: req.body.id }});
        await prisma.node.deleteMany({where: {node_id: req.body.id }});
        await prisma.edge.deleteMany({where: {source: req.body.id }});
        await prisma.edge.deleteMany({where: {target: req.body.id }});
    }
    if(req.body.type == "text"){
        await prisma.node.deleteMany({where: {node_id: req.body.id }});
    }
    if(req.body.type == "date"){
        await prisma.node.deleteMany({where: {node_id: req.body.id }});
    }
    if(req.body.type == "message"){
        await prisma.node.deleteMany({where: {node_id: req.body.id }});
    }
     res.json({ status: "success"}) 
     } catch (error) {
     console.error('Error inserting data:', error);
     }
};

export const deleteEdge = async (req: Request, res: Response, next: Function) => {
    //console.log("deleteNode",req.body);
    try {
    await prisma.edge.deleteMany({where: {edge_id: req.body.id }});
     res.json({ status: "success"}) 
     } catch (error) {
     console.error('Error inserting data:', error);
     }
};

export const retrieveData = async (req: Request, res: Response, next: Function) => {
    //console.log("deleteNode",req.body);

    try {
        const nodes = await prisma.node.findMany({ where: {language: req.body.language}});
        const edges = await prisma.edge.findMany({});
        const textOnly = await prisma.flowTextOnly.findMany({});
        const textBox = await prisma.flowTextBox.findMany({});
        const buttonData = await prisma.flowButtonData.findMany({});
        const cardData = await prisma.flowCardData.findMany({});

     res.json({ status: "success", nodes: nodes, edges: edges, textOnly: textOnly, textBox: textBox, buttonData: buttonData, cardData: cardData}) 

     } catch (error) {
     console.error('Error inserting data:', error);
     }
};


export const textOnlyData = async (req: Request, res: Response, next: Function) => {
    //console.log("insertEdge",req.body);
    try {
          const data_exist = await prisma.flowTextOnly.findFirst({
            where: {  node_id: req.body.id},
          });

        if (data_exist) {

            await prisma.flowTextOnly.updateMany({
                where: { node_id: req.body.id},
                data: {  text: req.body.text},
              });
        }
        else{
            await prisma.flowTextOnly.create({
                data: {
                    node_id: req.body.id,
                    text: req.body.text,
                },
              });
        }
        await prisma.node.updateMany({
            where: { node_id: req.body.id},
            data: {  intent: req.body.intent},
          });

        res.json({ status: "success"}) 
    } catch (error) {
    console.error('Error inserting data:', error);
    }
};
export const textBoxData = async (req: Request, res: Response, next: Function) => {
    //console.log("insertEdge",req.body);
    try {
          const data_exist = await prisma.flowTextBox.findFirst({
            where: {  node_id: req.body.id},
          });
        if (data_exist) {

            await prisma.flowTextBox.updateMany({
                where: { node_id: req.body.id},
                data: {   title: req.body.title, description: req.body.description,},
            });

        }
        else{
            await prisma.flowTextBox.create({
                data: {
                    node_id: req.body.id,
                    title: req.body.title,
                    description: req.body.description,
                },
            });
        }
        await prisma.node.updateMany({
            where: { node_id: req.body.id},
            data: {  intent: req.body.intent},
        });
        res.json({ status: "success"}) 
    } catch (error) {
    console.error('Error inserting data:', error);
    }
};

export const ButtonData = async (req: Request, res: Response, next: Function) => {
    //console.log("insertEdge",req.body);
    try {

          const data_exist = await prisma.flowButtonData.findFirst({
            where: {  node_id: req.body.id},
          });

        if (data_exist) {

            await prisma.flowButtonData.updateMany({
                where: { node_id: req.body.id},
                data: {   text: req.body.text, link: req.body.link},
            });

        }
        else{
            await prisma.flowButtonData.create({
                data: {
                    node_id: req.body.id,
                    text: req.body.text,
                    link: req.body.link,
                },
            });
        }
        
        res.json({ status: "success"}) 
    } catch (error) {
    console.error('Error inserting data:', error);
    }
};
export const ButtonGroup = async (req: Request, res: Response, next: Function) => {
    //console.log("insertEdge",req.body);
    try {
        await prisma.node.updateMany({
            where: { node_id: req.body.id},
            data: {  intent: req.body.intent },
        });
        res.json({ status: "success"}) 
    } catch (error) {
    console.error('Error inserting data:', error);
    }
};

export const CardData = async (req: Request, res: Response, next: Function) => { 
    console.log("CARD REQ DATA",req.body);
    try {
        let image_path = req.protocol + '://' + req.get('host')+ '/chat-logo.webp';
          const data_exist = await prisma.flowCardData.findFirst({
            where: {  node_id: req.body.id},
        });
          
        if (data_exist) {
            if (req.file) {
                const file = req.file;
                const blob = await put(file.originalname, file.buffer, { access: 'public',token:process.env.BLOB_READ_WRITE_TOKEN });
                console.log(blob); 
                image_path = blob.url
                await prisma.flowCardData.updateMany({
                    where: { node_id: req.body.id},
                    data: {    title: req.body.title,description: req.body.description,image: image_path},
                });
            }
           else{
            await prisma.flowCardData.updateMany({
                where: { node_id: req.body.id},
                data: {    title: req.body.title,description: req.body.description},
            });
           }
        }
        else{
            if (req.file) {
                const file = req.file;
                const blob = await put(file.originalname, file.buffer, { access: 'public',token:process.env.BLOB_READ_WRITE_TOKEN });
                console.log(blob); 
                image_path = blob.url
            }
            await prisma.flowCardData.create({
                data: {
                    node_id: req.body.id,
                    title: req.body.title,
                    description: req.body.description,
                    image: image_path,
                },
            });
        }
        if(req.body.type=="group"){
            await prisma.node.updateMany({
                where: { node_id: req.body.parentID},
                data: {   intent: req.body.intent},
            });
        }
        else{
            await prisma.node.updateMany({
                where: { node_id: req.body.id},
                data: {   intent: req.body.intent},
            });
        }
        res.json({ status: "success"}) 
    } catch (error) {
    console.error('Error inserting data:', error);
    }
};
export const getIntentData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let intent_id: number | undefined = parseInt(req.body.intent as string, 10);  
        const question_details = await prisma.question.findFirst({
            where: {  id: intent_id},
          });

        let intent = "";
        if(question_details){
            const node = await prisma.node.findFirst({
                where: {  id: question_details.intent},
              });
            if(node){
            intent = node.intent ?? '';
            }
        }
        let intentData: any[] = [];

        const node_details = await prisma.node.findMany({ where: {intent: intent}});
        console.log("node_details",node_details);
        for (const node of node_details) {
            const { type, node_id } = node;
            let nodeData;

            switch (type) {
                case 'textOnly':
                    nodeData = await prisma.flowTextOnly.findFirst({ where: { node_id } });
                    break;
                case 'textinput':
                    nodeData = await prisma.flowTextBox.findFirst({ where: { node_id } });
                    break;
                case 'cardStyleOne':
                    nodeData = await prisma.flowCardData.findFirst({ where: { node_id } });
                    break;
                case 'buttonGroup': {
                    const buttons = await prisma.node.findMany({ where: { parent_id: node_id } });
                    let buttonData = await Promise.all(buttons.map(async button => ({
                        button: await prisma.flowButtonData.findFirst({ where: { node_id: button.node_id } }),
                    })));
                    nodeData = buttonData;
                    break;
                }
                case 'cardGroup': {
                    const childs = await prisma.node.findMany({ where: { parent_id: node_id } });
                    let childData = await Promise.all(childs.map(async child => {
                        if (child.type === 'cardHeader') {
                            return { card: await prisma.flowCardData.findFirst({ where: { node_id: child.node_id } }) };
                        } else {
                            return { button: await prisma.flowButtonData.findFirst({ where: { node_id: child.node_id } }) };
                        }
                    }));
                    nodeData = childData;
                    break;
                } 
                case 'formGroup': {
                    const fields = await prisma.node.findMany({ where: { parent_id: node_id } });
                    let fieldData = await Promise.all(fields.map(async f => ({
                        field: await prisma.node.findFirst({ where: { node_id: f.node_id } }),
                    })));
                    nodeData = fieldData;
                    break;
                } 
                default:
                    continue;
            }

            if (nodeData) {
                intentData.push({ type,node_id, node_data: nodeData });
            }
        }

        res.json({ status: "success", intentData });

    } catch (error) {
        console.error('Error retrieving intent data:', error);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
};


// export const getIntentData = async (req: Request, res: Response, next: Function) => {
//     // console.log("getProducts",req.body);
//      try {
//          let intentData: intentData[] = [];
//          let type: any;
//          let nodeData: any;
 
//          const node_details = await Node.findAll({
//              where: {
//                "intent" : req.body.intent,
//              },
//          });
//          for (var c = 0; c < node_details.length; c++){
             
//              type = node_details[c].type;
//              if(type == 'textOnly'){
//                  const node_data = await FlowTextOnly.findOne({
//                      where: {
//                          "node_id" : node_details[c].node_id,
//                      },
//                      });
//                  nodeData = node_data;
 
//                  intentData.push({type: type, node_data: nodeData});
//              }
//              if(type == 'textinput'){
//                  const node_data = await FlowTextBox.findOne({
//                      where: {
//                          "node_id" : node_details[c].node_id,
//                      },
//                      });
//                  nodeData = node_data;
 
//                  intentData.push({type: type, node_data: nodeData});
//              }
//              if(type == 'cardStyleOne'){
//                  const node_data = await FlowCardData.findOne({
//                      where: {
//                          "node_id" : node_details[c].node_id,
//                      },
//                      });
//                  nodeData = node_data;
//                  intentData.push({type: type, node_data: nodeData});
//              }
//              if (type == 'buttonGroup') {
//                  const buttons = await Node.findAll({
//                      where: {
//                          "parentId": node_details[c].node_id,
//                      },
//                  });
             
//                  let buttonData: any[] = [];
             
//                  for (var x = 0; x < buttons.length; x++) {
//                      const node_data = await FlowButtonData.findOne({
//                          where: {
//                              "node_id": buttons[x].node_id,
//                          },
//                      });
//                      if (node_data) { 
//                          buttonData.push({ button: node_data }); 
//                      }
//                  }
//                  intentData.push({ type: type, node_data: buttonData });
//              }
 
//              if (type == 'cardGroup') {
//                  const childs = await Node.findAll({
//                      where: {
//                          "parentId": node_details[c].node_id,
//                      },
//                  });
             
//                  let buttonData: any[] = [];
             
//                  for (var x = 0; x < childs.length; x++) {
//                      if(childs[x].type == 'cardHeader'){
//                          const node_data = await FlowCardData.findOne({
//                              where: {
//                                  "node_id" : childs[x].node_id,
//                              },
//                          });
//                          if (node_data) { 
//                              buttonData.push({ card: node_data }); 
//                          }
//                      }
//                      else{
//                          const node_data = await FlowButtonData.findOne({
//                              where: {
//                                  "node_id": childs[x].node_id,
//                              },
//                          });
//                          if (node_data) { 
//                              buttonData.push({ button: node_data }); 
//                          }
//                      }
//                  }
 
//                  intentData.push({ type: type, node_data: buttonData });
//              }
             
//          }
//          console.log("intentData",intentData);
//          res.json({ status: "success", intentData:intentData}) 
 
         
         
//      } catch (error) {
//      console.error('Error inserting data:', error);
//      }
//  };

export const getTargetData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let sourceData: any[] = [];

        const targets = await prisma.edge.findMany({where: {source: req.body.source}});

        for (const singleTarget of targets) {
            const { target} = singleTarget;
            const target_node =  await prisma.node.findFirst({ where: { node_id:target } });
            const type = target_node?.type;
            let data;

            switch (type) {
                case 'textOnly':
                    data = await prisma.flowTextOnly.findFirst({ where: { node_id:target_node?.node_id } });
                    break;
                case 'textinput':
                    data = await prisma.flowTextBox.findFirst({ where: { node_id:target_node?.node_id } });
                    break;
                case 'cardStyleOne':
                    data = await prisma.flowCardData.findFirst({ where: { node_id:target_node?.node_id } });
                    break;
                case 'buttonGroup': {
                    const buttons = await prisma.node.findMany({ where: { parent_id: target_node?.node_id } });
                    let buttonData = await Promise.all(buttons.map(async button => ({
                        button: await prisma.flowButtonData.findFirst({ where: { node_id: button.node_id } }),
                    })));
                    data = buttonData;
                    break;
                }
                case 'cardGroup': {
                    const childs = await prisma.node.findMany({ where: { parent_id: target_node?.node_id } });
                    let childData = await Promise.all(childs.map(async child => {
                        if (child.type === 'cardHeader') {
                            return { card: await prisma.flowCardData.findFirst({ where: { node_id: child.node_id } }) };
                        } else {
                            return { button: await prisma.flowButtonData.findFirst({ where: { node_id: child.node_id } }) };
                        }
                    }));
                    data = childData;
                    break;
                }
                default:
                    continue;
            }

            if (data) {
                sourceData.push({ type, source_data: data });
            }
        } 
        res.json({ status: "success", sourceData });
    } catch (error) {
        console.error('Error retrieving intent data:', error);
        res.status(500).json({ status: "error", message: "Internal server error" });
    }
};

export const formData = async (req: Request, res: Response, next: Function) => {
    //console.log("insertEdge",req.body);
    try {
        await prisma.node.updateMany({
            where: { node_id: req.body.id},
            data: {  intent: req.body.intent},
        });
        console.log("FORM DATA",req.body)
        console.log("FORM DATA Inputs",req.body.inputs)
        await Promise.all(req.body.inputs.map(async (input) => {
            const data_exist = await prisma.node.findFirst({
                where: {  node_id: input.id},
              });

            if (data_exist) {

                await prisma.node.updateMany({
                    where: { node_id: input.id},
                    data: {  value: input.value,placeholder: input.placeholder,label: input.label},
                  });
            }
            else{
                await prisma.node.create({
                    data: {
                        node_id: input.id,
                        value: input.value,
                        placeholder: input.placeholder,
                        label: input.label,
                        type: input.type,
                        language: input.language,
                        parent_id: req.body.id,
                        position: input.position
                    },
                  });
            }

        }));
        
        res.json({ status: "success"}) 
    } catch (error) {
    console.error('Error inserting data:', error);
    }
};

export const saveFormSubmission = async (req: Request, res: Response, next: Function) => {
    //console.log("insertEdge",req.body);
    try {
        const valuesString = req.body.inputs.map((input: { label: string, value: string }) => `${input.label} - ${input.value}`).join(',');

        await prisma.flowFormSubmissions.create({
            data: {
                form_id: req.body.id,
                field_data: valuesString,
            },
          });
        
        res.json({ status: "success"}) 
    } catch (error) { 
    console.error('Error inserting data:', error);
    }
};