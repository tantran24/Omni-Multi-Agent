import styled from "styled-components";
export const Button = styled.button`
  padding: 10px 20px;
  margin: 5px;
  background: linear-gradient(135deg, #ff7e5f, #feb47b);
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, #e66a53, #e0a97d);
    transform: translateY(-2px);
  }
`;

export const IconButton = styled.button`
  background: linear-gradient(135deg, #ff7e5f, #feb47b);
  border: none;
  border-radius: 50%;
  padding: 10px;
  margin-left: 10px;
  cursor: pointer;
  box-shadow: 0 0 0 1px #e0e0e0;
  transition: background-color 0.2s, box-shadow 0.2s;

  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: #f0f0f0;
    box-shadow: 0 0 0 2px #d0d0d0;
  }

  svg {
    color: #4a4a4a;
    width: 20px;
    height: 20px;
  }
`;