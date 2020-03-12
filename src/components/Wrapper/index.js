import React from "react";
import styled from "styled-components";

export const Wrapper = React.memo(styled.div`
  position: ${props => props.layout || "relative"};
  display: flex !important;
  width: ${props =>
    !props.width ? "100%" : props.width === "auto" ? "auto" : props.width};
  height: ${props =>
    !props.height ? "100%" : props.width === "auto" ? "auto" : props.height};
  height: ${props => props.height || "100%"};  
  flex-direction: ${props => props.direction || "row"};
  justify-content: ${props => props.justify || "flex-start"};
  align-items: ${props => props.align || "start"};
  padding-top: ${props => props.pt + 'px' || 'auto'};
  padding-bottom: ${props => props.pb + 'px' || 'auto'};
  padding-left: ${props => props.pl + 'px' || 'auto'};
  padding-right: ${props => props.pr + 'px' || 'auto'};
  overflow-x: ${props => props.scrollx || "none"};
  overflow-y: ${props => props.scrolly || "none"};
  top: ${props => props.top + "px" || "auto"};
  bottom: ${props => props.bottom + "px" || "auto"};
  z-index: ${props => props.zindex || 0};
`);