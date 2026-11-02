// Properties each control version accepts, taken from canvas apps built with these exact versions
// (their .pa.yaml source and control files). The UI Kit checks every snippet against this list at build time.
export const ALLOWED_PROPS: Record<string, string[]> = {
  'GroupContainer@1.5.0': [
    'BorderColor', 'BorderStyle', 'BorderThickness', 'ChildTabPriority', 'ContentLanguage', 'DisplayMode',
    'DropShadow', 'EnableChildFocus', 'Fill', 'Height', 'LayoutAlignItems', 'LayoutDirection', 'LayoutGap',
    'LayoutGridColumnMinWidth', 'LayoutGridColumns', 'LayoutGridRowMinHeight', 'LayoutGridRows',
    'LayoutJustifyContent', 'LayoutMode', 'LayoutOverflowX', 'LayoutOverflowY', 'LayoutWrap', 'PaddingBottom',
    'PaddingLeft', 'PaddingRight', 'PaddingTop', 'RadiusBottomLeft', 'RadiusBottomRight', 'RadiusTopLeft',
    'RadiusTopRight', 'Visible', 'Width', 'X', 'Y', 'ZIndex',
  ],
  'Label@2.5.1': [
    'Align', 'AutoHeight', 'BorderColor', 'BorderStyle', 'BorderThickness', 'Color', 'ContentLanguage',
    'DisabledBorderColor', 'DisabledColor', 'DisabledFill', 'DisplayMode', 'Fill', 'FocusedBorderColor',
    'FocusedBorderThickness', 'Font', 'FontWeight', 'Height', 'HoverBorderColor', 'HoverColor', 'HoverFill',
    'IsErrorMessage', 'Italic', 'LineHeight', 'Live', 'OnSelect', 'Overflow', 'PaddingBottom', 'PaddingLeft',
    'PaddingRight', 'PaddingTop', 'PressedBorderColor', 'PressedColor', 'PressedFill', 'Role', 'Size',
    'Strikethrough', 'TabIndex', 'Text', 'Tooltip', 'Underline', 'VerticalAlign', 'Visible', 'Width', 'Wrap', 'X',
    'Y', 'ZIndex',
  ],
  'Classic/Button@2.2.0': [
    'Align', 'AutoDisableOnSelect', 'BorderColor', 'BorderStyle', 'BorderThickness', 'Color', 'ContentLanguage',
    'DisabledBorderColor', 'DisabledColor', 'DisabledFill', 'DisplayMode', 'Fill', 'FocusedBorderColor',
    'FocusedBorderThickness', 'Font', 'FontWeight', 'Height', 'HoverBorderColor', 'HoverColor', 'HoverFill',
    'Italic', 'OnSelect', 'PaddingBottom', 'PaddingLeft', 'PaddingRight', 'PaddingTop', 'PressedBorderColor',
    'PressedColor', 'PressedFill', 'RadiusBottomLeft', 'RadiusBottomRight', 'RadiusTopLeft', 'RadiusTopRight',
    'Size', 'Strikethrough', 'TabIndex', 'Text', 'Tooltip', 'Underline', 'VerticalAlign', 'Visible', 'Width', 'X',
    'Y', 'ZIndex',
  ],
  'Rectangle@2.3.0': [
    'AccessibleLabel', 'BorderColor', 'BorderStyle', 'BorderThickness', 'ContentLanguage', 'DisabledFill',
    'DisplayMode', 'Fill', 'FocusedBorderColor', 'FocusedBorderThickness', 'Height', 'HoverFill', 'OnSelect',
    'PreserveAspectRatio', 'PressedFill', 'TabIndex', 'Tooltip', 'Visible', 'Width', 'X', 'Y', 'ZIndex',
  ],
  'Circle@2.3.0': [
    'AccessibleLabel', 'BorderColor', 'BorderStyle', 'BorderThickness', 'ContentLanguage', 'DisabledFill',
    'DisplayMode', 'Fill', 'FocusedBorderColor', 'FocusedBorderThickness', 'Height', 'HoverFill', 'OnSelect',
    'PreserveAspectRatio', 'PressedFill', 'TabIndex', 'Tooltip', 'Visible', 'Width', 'X', 'Y', 'ZIndex',
  ],
  'Classic/Icon@2.5.0': [
    'AccessibleLabel', 'AutoDisableOnSelect', 'BorderColor', 'BorderStyle', 'BorderThickness', 'Color',
    'ContentLanguage', 'DisabledBorderColor', 'DisabledColor', 'DisabledFill', 'DisplayMode', 'Fill',
    'FocusedBorderColor', 'FocusedBorderThickness', 'Height', 'HoverBorderColor', 'HoverColor', 'HoverFill', 'Icon',
    'OnSelect', 'PaddingBottom', 'PaddingLeft', 'PaddingRight', 'PaddingTop', 'PreserveAspectRatio',
    'PressedBorderColor', 'PressedColor', 'PressedFill', 'Rotation', 'TabIndex', 'Tooltip', 'Visible', 'Width', 'X',
    'Y', 'ZIndex',
  ],
  'Image@2.2.3': [
    'AccessibleLabel', 'ApplyEXIFOrientation', 'AutoDisableOnSelect', 'BorderColor', 'BorderStyle',
    'BorderThickness', 'CalculateOriginalDimensions', 'ContentLanguage', 'DisabledBorderColor', 'DisabledFill',
    'DisplayMode', 'Fill', 'FlipHorizontal', 'FlipVertical', 'FocusedBorderColor', 'FocusedBorderThickness',
    'Height', 'HoverBorderColor', 'HoverFill', 'Image', 'ImagePosition', 'ImageRotation', 'OnSelect',
    'PaddingBottom', 'PaddingLeft', 'PaddingRight', 'PaddingTop', 'PressedBorderColor', 'PressedFill',
    'RadiusBottomLeft', 'RadiusBottomRight', 'RadiusTopLeft', 'RadiusTopRight', 'TabIndex', 'Tooltip',
    'Transparency', 'Visible', 'Width', 'X', 'Y', 'ZIndex',
  ],
  'Classic/TextInput@2.3.2': [
    'AccessibleLabel', 'Align', 'BorderColor', 'BorderStyle', 'BorderThickness', 'Clear', 'Color', 'ContentLanguage',
    'Default', 'DelayOutput', 'DisabledBorderColor', 'DisabledColor', 'DisabledFill', 'DisplayMode',
    'EnableSpellCheck', 'Fill', 'FocusedBorderColor', 'FocusedBorderThickness', 'Font', 'FontWeight', 'Format',
    'Height', 'HintText', 'HoverBorderColor', 'HoverColor', 'HoverFill', 'Italic', 'LineHeight', 'MaxLength', 'Mode',
    'OnChange', 'OnSelect', 'PaddingBottom', 'PaddingLeft', 'PaddingRight', 'PaddingTop', 'PressedBorderColor',
    'PressedColor', 'PressedFill', 'RadiusBottomLeft', 'RadiusBottomRight', 'RadiusTopLeft', 'RadiusTopRight',
    'Reset', 'Size', 'Strikethrough', 'TabIndex', 'Tooltip', 'Underline', 'VirtualKeyboardMode', 'Visible', 'Width',
    'X', 'Y', 'ZIndex',
  ],
  'Gallery@2.15.0': [
    'AccessibleLabel', 'AutoHeight', 'BorderColor', 'BorderStyle', 'BorderThickness', 'ContentLanguage', 'Default',
    'DelayItemLoading', 'DisabledBorderColor', 'DisabledFill', 'DisplayMode', 'Fill', 'FocusedBorderColor',
    'FocusedBorderThickness', 'Height', 'HoverBorderColor', 'HoverFill', 'Items', 'Layout', 'LoadingSpinner',
    'LoadingSpinnerColor', 'MaxTemplateSize', 'NavigationStep', 'OnSelect', 'PressedBorderColor', 'PressedFill',
    'Reset', 'Selectable', 'SelectionTracksMove', 'ShowNavigation', 'ShowScrollbar', 'TabIndex',
    'TemplateMaximumWidth', 'TemplatePadding', 'TemplateSize', 'Transition', 'Visible', 'Width', 'WrapCount', 'X',
    'Y', 'ZIndex',
  ],
  'Attachments@2.3.0': [
    'AccessibleLabel', 'AddAttachmentColor', 'AddAttachmentText', 'AddedItemColor', 'AddedItemFill', 'BorderColor',
    'BorderStyle', 'BorderThickness', 'Color', 'Default', 'DisabledBorderColor', 'DisabledColor', 'DisabledFill',
    'DisplayMode', 'DropTargetBackgroundColor', 'DropTargetBorderColor', 'DropTargetBorderStyle', 'DropTargetBorderThickness',
    'DropTargetTextColor', 'Fill', 'FocusedBorderColor', 'FocusedBorderThickness', 'Font', 'FontWeight', 'Height',
    'HoverBorderColor', 'HoverColor', 'HoverFill', 'ItemColor', 'ItemDisabledColor', 'ItemDisabledFill', 'ItemErrorColor',
    'ItemErrorFill', 'ItemFill', 'ItemHoverColor', 'ItemHoverFill', 'ItemPressedColor', 'ItemPressedFill', 'ItemSpacing',
    'Items', 'MaxAttachmentSize', 'MaxAttachments', 'MaxAttachmentsColor', 'MaxAttachmentsText', 'NoAttachmentsColor',
    'NoAttachmentsText', 'OnAddFile', 'PaddingBottom', 'PaddingLeft', 'PaddingRight', 'PaddingTop', 'PressedBorderColor',
    'PressedColor', 'PressedFill', 'RemovedItemColor', 'RemovedItemFill', 'Reset', 'Size', 'Tooltip', 'Visible', 'Width',
    'X', 'Y', 'ZIndex',
  ],
  // OnChange is Add picture's documented event for a new photo; the rest come from an app that uses it.
  'AddMedia@2.2.1': [
    'Align', 'BorderColor', 'BorderStyle', 'BorderThickness', 'ChangePictureText', 'Color', 'DisabledBorderColor',
    'DisabledColor', 'DisabledFill', 'DisplayMode', 'Fill', 'FocusedBorderColor', 'FocusedBorderThickness', 'Font',
    'FontWeight', 'Height', 'HoverBorderColor', 'HoverColor', 'HoverFill', 'Italic', 'OnChange', 'OnSelect',
    'PressedBorderColor', 'PressedColor', 'PressedFill', 'Size', 'Strikethrough', 'Text', 'Underline', 'VerticalAlign',
    'Visible', 'Width', 'X', 'Y', 'ZIndex',
  ],
};

/** Set on any control that sits inside an auto-layout container. */
export const LAYOUT_CHILD_PROPS = ['AlignInContainer', 'FillPortions', 'LayoutMinWidth', 'LayoutMinHeight', 'LayoutMaxWidth', 'LayoutMaxHeight'];
