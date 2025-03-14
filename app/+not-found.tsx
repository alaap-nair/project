import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledLink = styled(Link);

function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <StyledView className="flex-1 items-center justify-center p-5">
        <StyledText className="text-xl font-semibold mb-4">
          This screen doesn't exist.
        </StyledText>
        <StyledLink href="/" className="mt-4 py-4">
          <StyledText className="text-blue-500">
            Go to home screen!
          </StyledText>
        </StyledLink>
      </StyledView>
    </>
  );
}

export default styled(NotFoundScreen);
