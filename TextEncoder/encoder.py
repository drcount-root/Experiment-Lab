def encode_text(input_text):
    encoded_text = ""
    for char in input_text:
        if char.isalpha():
            if char.isupper():
                encoded_char = chr((ord(char) - ord('A') - 1) % 26 + ord('A'))
            else:
                encoded_char = chr((ord(char) - ord('a') - 1) % 26 + ord('a'))
        else:
            encoded_char = char
        encoded_text += encoded_char
    return encoded_text

user_input = input("Enter the text to encode: ")
encoded_output = encode_text(user_input)
print("Encoded output:", encoded_output)