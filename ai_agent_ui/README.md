# What is this?

The future of AI Assistant for Cardano Dreps and anyone interested in Cardano Governance.

# Info
This repo is still based on webpack/babel verison of electron, eventually it'll be switched over to Vite.

# How to use the AI and Governance UI

To use the app itself you'll need to have Ollama running https://ollama.com/ with a model of your choice for now.

Then just:

1. git clone https://github.com/Photrek/ai_assistant_for_governance
2. cd ai_assistant_for_governance
3. cd ai_agent_ui
3. npm install
4. now you have two options to run this: `npm start` or `npm run dev`. <br />
   The differnces is, one will run in a web browser window the other in a electron container.
5. Once everything is runnig you should be able to see the app, select your Ollama Model and Specify a Ogmios instance.

# How to run Ollama locally to work with the AI Agent
These instructions might be slightly different on Windows systems.
After installing Ollama, you will need to pull a model that can run on your system
and that supports tooling.

Two that stand out right away are:
llama3.1:8b  4.9 GB - this model is the least system intensive and doesn't require a GPU. Minimum should be at least 32GB of ram and at least a a CPU that's about the same tech specs as a Intel I7-13xxx Gen.
llama3.3:70b 42 GB  - this model is pretty system resource intensive and I recommend having at least 64GB of Ram and Robust CPU if you don't have a GPU.   

After installing Ollama make you setup these two enviroment vars.  

`export OLLAMA_MODELS="/usr/share/ollama/.ollama/models"` This is a little bit different on Mac and Windows
`export OLLAMA_ORIGINS="*"`

and then run Ollama with:

`ollama serve`

**Note**: If you need a cardano Ogmios/Node instance, I recomend https://demeter.run, their free tier allows for a single conneciton instance which is more than enough for the dapp.


<hr />
# Tools
in the `src/` dir you will see a folder called `model_tuning` in there there are several folder of interest: <br />

**`model_training_python`**: There are two python scripts in here, one for fine tuning your llm using CPU and the other GPU.<br />

**Note**: if you're using just CPU you will need a little bit more than 42GB of Ram, recomended is 64GB and it might take a while depending on which model you chose to train.
<br /><br />
You will also need a [hugging face](https://huggingface.co/) Auth Token and have access to whichever model you are planning on fine tuning.
<br />
If you open either python script you will see a variable called `huggingFaceToken` this is where you provide it at.
<br />
To use the scripts, you'll need to CD into the `model_training_python` directory and run the following commands:

1)  python -m venv llm_finetuning_env
2)  source llm_finetuning_env/bin/activate
3)  pip install -r requirements.txt

**Note**: best GPUs to use so far are Nvidia GPUs, AMD GPU's are picky depending on which Linux Distro you're using. 
From my experience Ubuntu is much easier to use with AMD GPUs.
<br /><hr />

`webscraper` is a script written in typescript which you can run with `npm run webscrap` and you can specify the domains to scrape in the script file itself.
<br /><hr />

`tools` one simple bash script to combine all json files to jsonl files that are used by the trianing tools.
