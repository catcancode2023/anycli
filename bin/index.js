#!/usr/bin/env node
import fs from "fs";
import yaml from "js-yaml";
import inquirer from "inquirer";
import { spawn } from "child_process";


const readConfig = (configPath)=>{
  const defaultPrompts = [
    {
      name:`Set config file`,
      type: "input",
      message: "config file path:",
      validate(value) {
        const pass = value.match(/^[a-z0-9-_+~.\/]+yaml$/i);
        if (pass) {
          return true;
        }
        return 'Please enter a valid yaml file path';
      },
      default: './anycli.yaml'
    }];
  try{
    const readData = fs.readFileSync(configPath, 'utf8');
    const prompts = yaml.load(readData);    
    return prompts;
  }
  catch (error) {
    console.log(`error read config ${configPath}`)
    return defaultPrompts;
  }
}
const anyInquirer = (filePath)=>{
  let prompts = readConfig(filePath);
  inquirer
    .prompt(prompts)
    .then((answer) => {
        let newConfigPath = answer['Set config file']
        if(newConfigPath){
          anyInquirer(newConfigPath);
        }
        else{
          let run = answer['run'];
          if(run){
            const [cmd, ...opts] = run;
            const exeout = spawn(cmd, opts);
            exeout.stdout.on("data", data => {
                console.log(`stdout: ${data}`);
            });
            
            exeout.stderr.on("data", data => {
                console.log(`stderr: ${data}`);
            });
            
            exeout.on('error', (error) => {
                console.log(`error: ${error.message}`);
            });
            
            exeout.on("close", code => {
                console.log(`child process exited with code ${code}`);
            });
          }
          else{
            console.log(answer);
            console.log(`
              Not find default run, please try this sample config:
              - name: run
                type: list
                message: run command
                choices:
                  - name: run
                    short: "run ls -l"
                    value: ["ls"]`)
          }  
        }
    });
}
var args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  displayHelp();
} else {
  anyInquirer(args.length===0?'./anycli.yaml':args[0]);
}

function displayHelp() {
  // Display help information
  console.log('Usage: node yourScript.js [options] [command]');
  console.log('Options:');
  console.log('  -h, --help     display help');
  console.log('Commands:');
  console.log('  ./anycli.yaml  provide custom config, default ./anycli.yaml');
  // Add more commands and their descriptions as needed
}

