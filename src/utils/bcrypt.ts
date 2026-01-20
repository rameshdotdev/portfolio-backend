import bcrypt from "bcrypt";

export const comparePassword = async (
  enteredPassword: string,
  hashedPassword: string
) => {
  return await bcrypt.compare(enteredPassword, hashedPassword);
};
