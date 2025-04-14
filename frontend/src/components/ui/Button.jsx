import styled from "styled-components";

/**
 * Standard button component with consistent styling
 */
export const Button = styled.button`
  padding: 10px 20px;
  margin: 5px;
  background: linear-gradient(135deg, #ff7e5f, #feb47b);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, #e66a53, #e0a97d);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

/**
 * Icon button for actions with icons
 */
export const IconButton = styled.button`
  background: linear-gradient(135deg, #ff7e5f, #feb47b);
  border: none;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  margin-left: 8px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  color: white; // Base color for the button

  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  svg {
    width: 18px;
    height: 18px;
    stroke: white;
    fill: none;
  }
`;
