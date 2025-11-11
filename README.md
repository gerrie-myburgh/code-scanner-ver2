# code-scanner-ver2

## General
This plugin scans text files and extract blocks of lines that start with a specific pattern. This pattern can be something like `////`.

Once a block is extracted it is written to a md file in the current vault. One block of lines goes into one .md file.

The extraction of the blocks is done by using rust based executables. The zip file containing the executables is at [location](https://github.com/gerrie-myburgh/code-scanner-ver2/releases/download/1.0.0/get-comments.zip)  on github.

The source for the rust program can be found at [github](https://github.com/gerrie-myburgh/get-comments).

Download the zip file and extract the content then place the executable files in the root of the ***code-scanner-ver2*** plugin folder. The names of the executable files are:

 1. `get-comments-linux`
 2. `get-comments-macos`
 3. `get-comments.exe`.

## Configuration
The plugin must be configured in the settings tab before usage.

 - Folder - the root folder where the text files are located to be scanned
 - Working Folder - the name of the folder in the vault where the md files will be created
 - Start - the pattern that starts a block of lines to be extracted
 - MD File path definition - this is '.' seperated names of permitted folders and md files that may be created. An example of this is `EPIC.ITEM.TEST`. This means that the folder depth may at most be 3 deep. First level after the Start starts with EPIC. The Second level starts with ITEM. The third level starts with TEST.
  - Extension - the extension of the files to be scanned. An example of this is `.txt`. This means that only files with the extension .txt will be scanned.

## Usage
Once the plugin is loaded then the trigger element will be an eye icon with the tooltip 'Scan text files for comment lines'. Once this is clicked the plugin will scan the text files and create md files in the vault.

The blocks have a specific format that is used to identify the start of a block. The start of a block is identified by the pattern defined in the Start setting. The end of a block is identified by the an absence of a Start pattern. The first line of the block is the path name (if any) and md file name into which the block will be written.

Examples of this are:

 1. ////EPIC epic file name - This will create a file named `EPIC epic file name.md` under the Working Folder.
 2. ////EPIC epic folder name.ITEM item file name - This will create a folder named `EPIC epic folder name` under the Working Folder and the file `ITEM item file name.md` under the EPIC folder.

## Disclosure
This plugin uses rust based executables to scan text files outside of the vault to create md files in the vault. This is done as a previous plugin used WASM to do the actual parsing of the text passed to it by java script. This proved computationally expensive due to the difference in character encoding between rust and java script.
