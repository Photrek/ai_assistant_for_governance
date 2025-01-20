# What is this?

The future of AI Assistant for Cardano Dreps and anyone interested in Cardano Governance.

# Info
This repo is still based on webpack/babel verison of electron, eventually it'll be switched over to Vite.

# How to use

To use the app itself you'll need to have Ollama running https://ollama.com/ with a model of your choice for now.

Then just:

1. git clone https://github.com/Photrek/ai_assistant_for_governance
2. cd ai_assistant_for_governance
3. npm install
4. now you have two options to run this: `npm start` or `npm run electron-dev`. <br />
   The differnces is, one will run in a web browser window the other in a electron container.
5. Once everything is runnig you should be able to see the app, select your Ollama Model and Specify a Ogmios instance.


# Tools
in the `src/` dir you will see a folder called `model_tuning` in there there are several folder of interest: <br />

`model_training_python`: There are two python scripts in here, one for fine tuning your llm using CPU and the other GPU.<br />
Note: if you're using just CPU you will need a little bit more than 42GB of Ram, recomended is 64GB and it might take a while depending on which model you chose to train.<br />
You will also need a [hugging face](https://huggingface.co/) Auth Token and have access to whichever model you are planning on fine tuning whihc you input into the Python script.

`webscraper` is a script written in typescript which you can run with `npm run webscrap` and you can specify the domains to scrape in the script file itself.

`tools` one simple bash script to combine all json files to jsonl files that are used by the trianing tools.
