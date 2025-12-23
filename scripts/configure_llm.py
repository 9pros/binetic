import os
import sys

def setup_llm():
    print("🧠 Binetic LLM Configuration")
    print("============================")
    print("To give Binetic high-level reasoning capabilities, you need to configure a cloud model.")
    print("Supported: OpenAI (GPT-4o), Anthropic (Claude 3.5), DeepSeek, etc.")
    
    print("\nCurrent Configuration:")
    if os.path.exists(".env"):
        with open(".env", "r") as f:
            print(f.read())
    else:
        print("No .env file found.")
    
    print("\nTo configure, create a .env file with:")
    print("OPENAI_API_KEY=sk-...")
    print("ANTHROPIC_API_KEY=sk-ant-...")
    print("DEFAULT_MODEL=gpt-4o")
    
    print("\nWould you like to create a template .env file? (y/n)")
    choice = input("> ")
    
    if choice.lower() == 'y':
        with open(".env", "w") as f:
            f.write("# Binetic LLM Configuration\n")
            f.write("# Uncomment and fill in your keys\n\n")
            f.write("# OPENAI_API_KEY=sk-...\n")
            f.write("# ANTHROPIC_API_KEY=sk-ant-...\n")
            f.write("# DEEPSEEK_API_KEY=...\n")
            f.write("\n# Model Selection\n")
            f.write("DEFAULT_MODEL=gpt-4o\n")
        print("✅ Created .env template. Please edit it with your actual keys.")

if __name__ == "__main__":
    setup_llm()
