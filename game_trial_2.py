import random
import copy
#Create the board size variable
boardSize = 4

# This code will print the board the way we want
def display():
    #find out which value is the largest
    largest = board[0][0]
    for row in board:
        for element in row:
            if element > largest:
                largest = element
        
    #Set the max number of spaces needed to the length of the largest value
    numSpaces = len(str(largest))



    for row in board:
        currentRow = "|"
        for element in row:
            #If the current element is 0, add a space
            if element == 0:
                currentRow += " " * numSpaces + "|"
            #if not we add the value
            else:
                currentRow +=(" " * (numSpaces - len(str(element)))) + str(element) + "|"
        #Print the generated row
        print(currentRow)
    print()


#This function merges one row left
def mergeOneRowL(row):
    # MOve everyhting as far left as possible
    for j in range(boardSize - 1):
        for i in range(boardSize - 1, 0, -1):
            # Test if there is an empty space, move over if so
            if row[i - 1] == 0:
                row[i - 1] = row[i]
                row[i] = 0

#Merge everything to the left
    for i in range(boardSize - 1):
        #Test if the current value is identical to the one next to it
        if row[i] == row[i + 1]:
            row[i] *= 2
            row[i + 1] = 0
        
    # Move everything to the left again
    for i in range(boardSize - 1, 0, -1):
        if row[i - 1] == 0:
            row[i - 1] = row[i]
            row[i] = 0
    return row

#This function merges the whole board to the left
def merge_left(currentBoard):
    # Merge every row in the board left
    for i in range(boardSize):
        currentBoard[i] = mergeOneRowL(currentBoard[i])
    return currentBoard

#This function reverses the order of one row 
def reverse(row):
    #Add all elements of the row to a new list, in reverse order
    new = []
    for i in range (boardSize - 1, -1, -1):
        new.append(row[i])
    return new  

#This function merges the whole board right
def merge_right(currentBoard):
    #Look at every row in the board
    for i in range(boardSize):
        #Reverse the row, merge to the left, then reverse back
        currentBoard[i] = reverse(currentBoard[i])
        currentBoard[i] = mergeOneRowL(currentBoard[i])
        currentBoard[i] = reverse(currentBoard[i])
    return currentBoard

# this function transposes the whole board
def transpose(currentBoard):
    for j in range(boardSize):
        for i in range(j, boardSize):
            if not i == j:
                temp = currentBoard[j][i]
                currentBoard[j][i] = currentBoard[i][j]
                currentBoard[i][j] = temp
    return currentBoard

#This function merges the whole board up
def merge_up(currentBoard):
    #Transposes the whole board, merges it all left, then transposes it back
    currentBoard = transpose(currentBoard)
    currentBoard = merge_left(currentBoard)
    currentBoard = transpose(currentBoard)
    return currentBoard

#This function merges the whole board down
def merge_down(currentBoard):
    #Transposes the whole board, merges it all right, then transposes it back
    currentBoard = transpose(currentBoard)
    currentBoard = merge_right(currentBoard)
    currentBoard = transpose(currentBoard)
    return currentBoard

#This function picks a new value for the board
def pickNewValue():
    if random.randint(1, 8) == 1:
        return 4
    else:
        return 2
    
#This function adds a value to the board in one of the empty spaces
def addNewValue():
    rowNum = random.randint(0, boardSize - 1)
    colNum = random.randint(0, boardSize - 1)

    #Pick spots until we find one that is empty
    while not board[rowNum][colNum] == 0:
        rowNum = random.randint(0, boardSize - 1)
        colNum = random.randint(0, boardSize - 1)

    #Fill the empty spot with a new value
    board[rowNum][colNum] = pickNewValue()

#This function tests if the user has won
def won():
    for row in board:
        if 2048 in row:
            return True
    return False

#This function tests if the user has lost
def noMoves():
    #Create two copies of the board
    tempBoard1 = copy.deepcopy(board)
    tempBoard2 = copy.deepcopy(board)

    #Test every possible move
    tempBoard1 = merge_down(tempBoard1)
    if tempBoard1 == tempBoard2:
        tempBoard1 = merge_up(tempBoard1)
        if tempBoard1 == tempBoard2:
            tempBoard1 = merge_left(tempBoard1)
            if tempBoard1 == tempBoard2:
                tempBoard1 = merge_right(tempBoard1)
                if tempBoard1 == tempBoard2:
                    return True
    return False
# Create a blank board
board = []
for i in range(boardSize):
    row=[]
    for j in range(boardSize):
        row.append(0)
    board.append(row)

#Fill two spots with random values, to start the game
numNeeded = 2 
while numNeeded > 0:
    rowNum = random.randint(0, boardSize - 1)
    colNum = random.randint(0, boardSize - 1)

    if board[rowNum][colNum] == 0:
        board[rowNum][colNum] = pickNewValue()
        numNeeded -=1

print("Welcome to 2048! Your goal is to combine values to get the number 2048, by merging the board by merging the board in different directions" \
"Everytime, you will need to type 'd' to merge right, 'w' to merge up, 'a' to merge left, and 's' to merge down\n here is the starting board")
         
display()

gameOver = False

#Repeat asking the user for new moves while the game isn't over
while not gameOver:
    move = input("Which way do you want to merge? ")

    #Assume they entered a valid input
    validInput = True

    #Create a copy of the board
    tempBoard = copy.deepcopy(board)

    #Figure out which way the person wants to merge and use the correct function
    if move == "d":
        board = merge_right(board)
    elif move == "w":
        board = merge_up(board)
    elif move == "s":
        board = merge_down(board)
    elif move == "a":
        board = merge_left(board)
    else:
        validInput = False

# If the input was not valid, they need to enter a new input, so this round is over
    if not validInput:
        print("Your input was invalid, please try again")
    #Otherwise their input was valid
    else:
        #Test if their move was unsuccesful
        if board == tempBoard:
            #Tell them to try again
            print("Try a different direction!")
        else:
            #Test if the user has won
            if won():
                display()
                print("You have won")
                gameOver = True
            else:
                #add a new value
                addNewValue()
                display()

                #Figure out if they lost
                if noMoves():
                    print("Sorry, you have no more possible moves, you lose!")
                    gameOver = True